import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
// CRITICAL: Dynamic import to prevent top-level execution during build
// import { processTicketIssuance } from "@/lib/queue";
import { applyRateLimit, RATE_LIMITS, safeLog, getRequestMetadata } from "@/lib/security";
import { createAuditLog } from "@/lib/audit";

/**
 * POST /api/tickets/[id]/resend
 * Resend ticket email
 * Rate limited to prevent spam
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(req, RATE_LIMITS.resendTicket);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Verify ownership
    const isOwner = ticket.holderUserId === session.user.id;
    const isOrderOwner = ticket.order.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isOwner && !isOrderOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if email was already sent recently (prevent spam)
    const recentEmailLog = await prisma.emailLog.findFirst({
      where: {
        template: "ticket-delivery",
        relatedOrderId: ticket.orderId,
        status: "SENT",
        sentAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentEmailLog) {
      return NextResponse.json(
        { 
          error: "Email já foi enviado recentemente. Por favor, aguarde antes de solicitar novamente.",
          retryAfter: 3600,
        },
        { status: 429 }
      );
    }

    // Queue ticket email resend - DISABLED (Redis disabled)
    // Queue service is disabled - skip queue processing
    // Note: In production, you may want to send email directly here

    // Audit log
    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: session.user.id,
      action: "TICKET_EMAIL_RESENT",
      resourceType: "ticket",
      resourceId: ticketId,
      details: {
        orderId: ticket.orderId,
        eventId: ticket.eventId,
      },
      ...metadata,
    });

    safeLog.info(`Ticket email resent: ${ticketId}`, { ticketId, orderId: ticket.orderId });

    return NextResponse.json({
      success: true,
      message: "Email será reenviado em breve",
    });
  } catch (error: any) {
    safeLog.error("Error resending ticket email", error);
    return NextResponse.json(
      { error: "Failed to resend ticket email" },
      { status: 500 }
    );
  }
}

