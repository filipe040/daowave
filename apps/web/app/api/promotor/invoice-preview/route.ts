import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { invoiceThemeSchema } from "@/lib/invoice/invoice-theme";
import {
  buildSampleInvoiceData,
  generateInvoiceHtml,
  generateInvoicePDF,
} from "@/lib/invoice/invoice-pdf.service";
import { resolveInvoiceTheme } from "@/lib/invoice/invoice-theme";
import { safeLog } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const previewSchema = z.object({
  scope: z.enum(["organization", "event"]).default("organization"),
  eventId: z.string().uuid().optional(),
  invoiceThemeJson: invoiceThemeSchema.optional().nullable(),
  format: z.enum(["html", "pdf"]).default("html"),
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
 * POST /api/promotor/invoice-preview — pré-visualização do design de faturas
 */
export async function POST(req: NextRequest) {
  try {
    const { orgId } = await requirePromoter();
    if (!orgId) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }
    const body = await req.json();
    const parsed = previewSchema.parse(body);

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        name: true,
        address: true,
        vatNumber: true,
        logoUrl: true,
        website: true,
        invoiceThemeJson: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    let event = null;
    if (parsed.scope === "event") {
      if (!parsed.eventId) {
        return NextResponse.json({ error: "eventId é obrigatório" }, { status: 400 });
      }
      event = await prisma.event.findFirst({
        where: { id: parsed.eventId, organizationId: orgId },
        select: {
          title: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          invoiceThemeJson: true,
        },
      });
      if (!event) {
        return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
      }
    }

    const orgForResolve = {
      ...org,
      invoiceThemeJson:
        parsed.scope === "organization" && parsed.invoiceThemeJson !== undefined
          ? parsed.invoiceThemeJson
          : org.invoiceThemeJson,
    };

    const eventForResolve =
      parsed.scope === "event" && event
        ? {
            ...event,
            invoiceThemeJson:
              parsed.invoiceThemeJson !== undefined
                ? parsed.invoiceThemeJson
                : event.invoiceThemeJson,
          }
        : event;

    const theme = resolveInvoiceTheme({
      organization: orgForResolve,
      event: eventForResolve,
    });

    const sample = buildSampleInvoiceData(theme, org);

    if (parsed.format === "pdf") {
      const pdf = await generateInvoicePDF(sample);
      return new Response(pdf as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline; filename=fatura-preview.pdf",
        },
      });
    }

    return htmlResponse(generateInvoiceHtml(sample));
  } catch (error: unknown) {
    const err = error as { digest?: string; message?: string; name?: string };
    if (err.digest?.includes("NEXT_REDIRECT")) throw error;
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Dados de preview inválidos" }, { status: 400 });
    }
    safeLog.error("Error generating invoice preview", error);
    return NextResponse.json(
      { error: err.message || "Erro ao gerar pré-visualização" },
      { status: 500 }
    );
  }
}
