import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl, uploadTicketPDF } from "@/lib/storage";
import { generateTicketPDF } from "@/lib/email-service";
import { createAuditLog, getRequestMetadata } from "@/lib/security";

/**
 * GET /api/tickets/[id]/pdf
 * Get presigned URL for ticket PDF download
 * PDFs are private and require authentication
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

    // Find ticket and verify ownership
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        ticketLot: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Verify ownership (holder or admin/organizer)
    const isOwner = ticket.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    const isOrganizer = session.user.role === "PROMOTER";

    if (!isOwner && !isAdmin && !isOrganizer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate presigned URL (expires in 1 hour)
    const pdfKey = `tickets/${ticketId}.pdf`;
    const presignedUrl = await getPresignedUrl(pdfKey, 3600);

    // Audit log
    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: session.user.id,
      action: "TICKET_PDF_ACCESSED",
      resourceType: "ticket",
      resourceId: ticketId,
      details: {
        eventId: ticket.eventId,
        eventTitle: ticket.event.title,
      },
      ...metadata,
    });

    return NextResponse.json({
      url: presignedUrl,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error("Error generating PDF URL:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF URL" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets/[id]/pdf
 * Generate and upload ticket PDF to storage
 * Called by queue worker after ticket issuance
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify this is an internal request (from queue worker)
    const authHeader = req.headers.get("authorization");
    const internalSecret = process.env.INTERNAL_API_SECRET;

    if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        ticketLot: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generateTicketPDF(ticket as any);

    // Upload to storage
    const pdfKey = `tickets/${ticketId}.pdf`;
    await uploadTicketPDF(ticketId, pdfBuffer);

    return NextResponse.json({
      success: true,
      key: pdfKey,
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
