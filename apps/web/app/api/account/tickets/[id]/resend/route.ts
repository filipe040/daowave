import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog, getRequestMetadata } from "@/lib/security";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.resendTicket);
  if (rateLimitRes) return rateLimitRes;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: ticketId } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { order: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Bilhete não encontrado" }, { status: 404 });
  }
  if (ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const recentEmailLog = await prisma.emailLog.findFirst({
    where: {
      template: "ticket-delivery",
      relatedOrderId: ticket.orderId,
      status: "SENT",
      sentAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentEmailLog) {
    return NextResponse.json(
      { error: "Email já foi enviado recentemente. Aguarde antes de solicitar novamente.", retryAfter: 3600 },
      { status: 429 }
    );
  }

  try {
    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: session.user.id,
      action: "TICKET_EMAIL_RESENT",
      resourceType: "ticket",
      resourceId: ticketId,
      details: { orderId: ticket.orderId, eventId: ticket.eventId },
      ...metadata,
    });
    safeLog.info(`Ticket email resent: ${ticketId}`, { ticketId, orderId: ticket.orderId });
  } catch (e) {
    console.error("[account/tickets/resend] audit error:", e);
  }

  return NextResponse.json({ success: true, message: "Email será reenviado em breve" });
}
