import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { TicketRenderService } from "@/lib/tickets/ticket-render.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/promotor/ticket-preview
 * Generate a PDF preview using a specific template
 * Query params: ticketId (optional), templateId (required)
 */
export async function GET(req: NextRequest) {
    try {
        const { orgId } = await requirePromoter();
        const { searchParams } = new URL(req.url);
        const templateId = searchParams.get("templateId");
        const ticketId = searchParams.get("ticketId");

        if (!templateId) {
            return NextResponse.json({ error: "templateId is required" }, { status: 400 });
        }

        // If no ticketId provided, we can't easily preview without a sample.
        // For now, let's assume we need a valid ticketId for the preview.
        // (In a real app, we'd pick a sample ticket from the organization)
        if (!ticketId) {
            return NextResponse.json({ error: "ticketId is required for preview at this stage" }, { status: 400 });
        }

        const pdfBuffer = await TicketRenderService.renderPdf(ticketId, templateId);

        return new Response(pdfBuffer as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": "inline; filename=preview.pdf",
            },
        });
    } catch (error: any) {
        if (error.digest?.includes("NEXT_REDIRECT")) throw error;
        safeLog.error("Error generating ticket preview", error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
