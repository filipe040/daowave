/**
 * GET/PATCH /api/promotor/invoice-theme
 * Tema de faturas ao nível da organização
 */

import { NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  DEFAULT_INVOICE_THEME,
  normalizeInvoiceThemeInput,
  resolveInvoiceTheme,
} from "@/lib/invoice/invoice-theme";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { orgId } = await requirePromoter();
    if (!orgId) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        legalName: true,
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

    const resolved = resolveInvoiceTheme({ organization: org });

    return NextResponse.json({
      organization: {
        id: org.id,
        name: org.name,
        legalName: org.legalName,
        address: org.address,
        vatNumber: org.vatNumber,
      },
      invoiceThemeJson: org.invoiceThemeJson ?? null,
      resolvedTheme: resolved,
      defaults: DEFAULT_INVOICE_THEME,
    });
  } catch (error) {
    console.error("[invoice-theme] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { orgId } = await requirePromoter();
    if (!orgId) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 404 });
    }
    const body = await request.json().catch(() => ({}));

    let invoiceThemeJson: Prisma.InputJsonValue | typeof Prisma.DbNull;
    if (body.invoiceThemeJson === null) {
      invoiceThemeJson = Prisma.DbNull;
    } else if (body.invoiceThemeJson !== undefined) {
      invoiceThemeJson = normalizeInvoiceThemeInput(body.invoiceThemeJson) as Prisma.InputJsonValue;
    } else {
      return NextResponse.json(
        { error: "invoiceThemeJson é obrigatório" },
        { status: 400 }
      );
    }

    const org = await prisma.organization.update({
      where: { id: orgId },
      data: { invoiceThemeJson },
      select: {
        id: true,
        name: true,
        legalName: true,
        address: true,
        vatNumber: true,
        logoUrl: true,
        website: true,
        invoiceThemeJson: true,
      },
    });

    return NextResponse.json({
      ok: true,
      invoiceThemeJson: org.invoiceThemeJson,
      resolvedTheme: resolveInvoiceTheme({ organization: org }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    if (message.includes("Tema de fatura inválido")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("[invoice-theme] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
