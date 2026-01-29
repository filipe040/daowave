import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

interface TransferBody {
  ticketId: string;
  recipientEmail: string;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TransferBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ticketId, recipientEmail } = body;
  if (!ticketId || !recipientEmail) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, checkedInAt: true, eventId: true, code: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Not owner of ticket" }, { status: 403 });
    }

    if (ticket.checkedInAt) {
      return NextResponse.json({ error: "Cannot transfer a ticket that has been checked in" }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } });
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // perform transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticket.id },
        data: { userId: recipient.id },
        select: { id: true, userId: true },
      });

      // record audit
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "transfer_ticket",
          entityType: "Ticket",
          entityId: ticket.id,
          metaJson: {
            fromUserId: session.user.id,
            toUserId: recipient.id,
            toEmail: recipientEmail,
            code: ticket.code,
            eventId: ticket.eventId,
          },
        },
      });

      // optional: create TransferLog if model exists (best-effort)
      try {
        await tx.transferLog.create({
          data: {
            fromTicketId: ticket.id,
            toTicketId: ticket.id,
            fromUserId: session.user.id,
            toUserId: recipient.id,
            toEmail: recipientEmail,
          },
        });
      } catch (e) {
        // ignore transferLog errors (schema constraints) and continue
        console.warn("[transfer] transferLog create skipped:", e);
      }

      return updated;
    });

    return NextResponse.json({ success: true, ticket: result });
  } catch (error) {
    console.error("[api/account/tickets/transfer] POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

