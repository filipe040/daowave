import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTicketCode } from "@/lib/utils";
import { getQRPayload } from "@/lib/qr/generate";
import { z } from "zod";
import crypto from "crypto";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";

const InitiateTransferSchema = z.object({
  toEmail: z.string().email(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;
    const body = await req.json();
    const { toEmail } = InitiateTransferSchema.parse(body);

    // Find ticket and verify ownership
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        order: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if ticket is already checked in
    if (ticket.checkedInAt) {
      return NextResponse.json(
        { error: "Ticket cannot be transferred (already checked in)" },
        { status: 400 }
      );
    }

    // Find or create recipient user
    let toUser = await prisma.user.findUnique({
      where: { email: toEmail },
    });

    if (!toUser) {
      // Create user account for recipient
      const bcrypt = require("bcryptjs");
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const hash = await bcrypt.hash(tempPassword, 10);

      toUser = await prisma.user.create({
        data: {
          email: toEmail,
          passwordHash: hash,
          role: "USER",
          name: toEmail.split("@")[0],
        },
      });
    }

    // Create new ticket for recipient
    const code = generateTicketCode();
    const qrPayload = getQRPayload({ ticketId: '', code }); // Will be updated after creation

    const newTicket = await prisma.ticket.create({
      data: {
        eventId: ticket.eventId,
        orderId: ticket.orderId,
        ticketLotId: ticket.ticketLotId,
        userId: toUser.id,
        code,
        qrPayload,
      },
    });

    // Update QR payload with ticket ID
    const finalQRPayload = getQRPayload({ ticketId: newTicket.id, code });
    await prisma.ticket.update({
      where: { id: newTicket.id },
      data: { qrPayload: finalQRPayload },
    });

    // Note: Old ticket remains valid, transfer creates a new ticket
    // The TransferLog tracks the relationship

    // Create transfer log
    await prisma.transferLog.create({
      data: {
        fromTicketId: ticket.id,
        toTicketId: newTicket.id,
        fromUserId: session.user.id,
        toUserId: toUser.id,
        toEmail,
      },
    });

    return NextResponse.json({
      success: true,
      newTicketId: newTicket.id,
      message: "Transfer completed",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    safeLog.error("Transfer initiate error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
