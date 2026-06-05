import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { TicketRenderService } from "@/lib/tickets/ticket-render.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/promotor/ticket-preview
 * Preview ticket template as HTML (default) or PDF when format=pdf
 * Query params: templateId (required), ticketId (optional, defaults to SAMPLE)
 */
export async function GET(req: NextRequest) {
    try {
        await requirePromoter();
        const { searchParams } = new URL(req.url);
        const templateId = searchParams.get("templateId");
        const ticketId = searchParams.get("ticketId") || "SAMPLE";
        const format = searchParams.get("format") || "html";

        if (!templateId) {
            return NextResponse.json({ error: "templateId is required" }, { status: 400 });
        }

        if (format === "pdf") {
            try {
                const pdfBuffer = await TicketRenderService.renderPdf(ticketId, templateId);
                return new Response(pdfBuffer as BodyInit, {
                    headers: {
                        "Content-Type": "application/pdf",
                        "Content-Disposition": "inline; filename=preview.pdf",
                    },
                });
            } catch (pdfErr: unknown) {
                safeLog.warn("PDF preview failed, falling back to HTML", {
                    error: pdfErr instanceof Error ? pdfErr.message : String(pdfErr),
                });
            }
        }

        const html = await TicketRenderService.renderHtml(ticketId, templateId);
        return new Response(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
            },
        });
    } catch (error: unknown) {
        const err = error as { digest?: string; message?: string; stack?: string };
        if (err.digest?.includes("NEXT_REDIRECT")) throw error;
        safeLog.error("Error generating ticket preview", error);
        return NextResponse.json(
            { error: err.message || "Erro ao gerar pré-visualização" },
            { status: 500 }
        );
    }
}
