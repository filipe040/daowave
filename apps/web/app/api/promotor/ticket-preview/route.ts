import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { TicketRenderService } from "@/lib/tickets/ticket-render.service";
import { ThemeJson, TicketTemplatePreset, themeJsonSchema, TICKET_TEMPLATE_PRESETS } from "@/lib/ticket-templates/models";
import { normalizeTicketTheme } from "@/lib/ticket-templates/default-theme";
import { safeLog } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const draftPreviewSchema = z.object({
    preset: z.enum(TICKET_TEMPLATE_PRESETS),
    themeJson: themeJsonSchema,
    ticketId: z.string().optional(),
});

function htmlResponse(html: string) {
    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}

/**
 * GET /api/promotor/ticket-preview — preview do template guardado na BD
 * POST /api/promotor/ticket-preview — preview em tempo real (alterações não guardadas)
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
        return htmlResponse(html);
    } catch (error: unknown) {
        const err = error as { digest?: string; message?: string };
        if (err.digest?.includes("NEXT_REDIRECT")) throw error;
        safeLog.error("Error generating ticket preview", error);
        return NextResponse.json(
            { error: err.message || "Erro ao gerar pré-visualização" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        await requirePromoter();
        const body = await req.json();
        const parsed = draftPreviewSchema.parse({
            ...body,
            themeJson: normalizeTicketTheme(body.themeJson),
        });
        const ticketId = parsed.ticketId || "SAMPLE";

        const html = await TicketRenderService.renderHtmlDraft(
            ticketId,
            parsed.preset as TicketTemplatePreset,
            parsed.themeJson as ThemeJson
        );
        return htmlResponse(html);
    } catch (error: unknown) {
        const err = error as { digest?: string; message?: string; name?: string };
        if (err.digest?.includes("NEXT_REDIRECT")) throw error;
        if (err.name === "ZodError") {
            return NextResponse.json({ error: "Dados de preview inválidos" }, { status: 400 });
        }
        safeLog.error("Error generating draft ticket preview", error);
        return NextResponse.json(
            { error: err.message || "Erro ao gerar pré-visualização" },
            { status: 500 }
        );
    }
}
