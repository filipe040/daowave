import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTicketCode } from "@/lib/utils";
import { getQRPayload } from "@/lib/qr/generate";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const InitiateTransferSchema = z.object({
  toEmail: z.string().email("Email inválido"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: ticketId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = InitiateTransferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "toEmail inválido" },
      { status: 400 }
    );
  }
  const { toEmail } = parsed.data;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { event: true, order: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Bilhete não encontrado" }, { status: 404 });
  }
  if (ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (ticket.checkedInAt) {
    return NextResponse.json(
      { error: "Bilhete já utilizado no check-in. Não pode ser transferido." },
      { status: 400 }
    );
  }

  try {
    let toUser = await prisma.user.findUnique({ where: { email: toEmail.toLowerCase().trim() } });

    if (!toUser) {
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const hash = await bcrypt.hash(tempPassword, 10);
      toUser = await prisma.user.create({
        data: {
          email: toEmail.toLowerCase().trim(),
          passwordHash: hash,
          role: "USER",
          name: toEmail.split("@")[0],
        },
      });
    }

    const code = generateTicketCode();
    const qrPayload = getQRPayload({ ticketId: "", code });

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

    const finalQRPayload = getQRPayload({ ticketId: newTicket.id, code });
    await prisma.ticket.update({
      where: { id: newTicket.id },
      data: { qrPayload: finalQRPayload },
    });

    await prisma.transferLog.create({
      data: {
        fromTicketId: ticket.id,
        toTicketId: newTicket.id,
        fromUserId: session.user.id,
        toUserId: toUser.id,
        toEmail: toEmail.toLowerCase().trim(),
      },
    });

    return NextResponse.json({
      success: true,
      newTicketId: newTicket.id,
      message: "Transferência concluída",
    });
  } catch (e) {
    console.error("[account/tickets/transfer] error:", e);
    return NextResponse.json({ error: "Erro ao processar transferência" }, { status: 500 });
  }
}
