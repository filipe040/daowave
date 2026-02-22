import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl, uploadFile } from "@/lib/storage";
import { TicketRenderService } from "@/lib/tickets/ticket-render.service";
import { createAuditLog, getRequestMetadata } from "@/lib/security";

/**
 * GET /api/tickets/[id]/pdf
 * Returns the ticket PDF. Uses designs from the active template or snapshot.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Permission check
    const isOwner = ticket.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isPromoter = session.user.role === "PROMOTER";

    // In a real app we'd check if the promoter belongs to the org
    if (!isOwner && !isAdmin && !isPromoter) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate PDF buffer using the design system
    const pdfBuffer = await TicketRenderService.renderPdf(ticketId);

    // Audit log
    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: session.user.id,
      action: "TICKET_PDF_GENERATED",
      entityType: "ticket",
      entityId: ticketId,
      details: {
        eventId: ticket.eventId,
      },
      ...metadata,
    });

    // Return the PDF directly
    return new Response(pdfBuffer as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-${ticket.code}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating ticket PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate ticket PDF" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets/[id]/pdf
 * Pre-generate and upload ticket PDF to storage
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    const internalSecret = process.env.INTERNAL_API_SECRET;

    if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;

    // Generate PDF
    const pdfBuffer = await TicketRenderService.renderPdf(ticketId);

    // Upload to storage (fixed path for consistency)
    const pdfKey = `tickets/${ticketId}.pdf`;
    await uploadFile(pdfKey, pdfBuffer, "application/pdf");

    return NextResponse.json({
      success: true,
      key: pdfKey,
    });
  } catch (error: any) {
    console.error("Error pre-generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
