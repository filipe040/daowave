import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FinancialEngine } from "@/lib/finance/financial-engine";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const subtotalCents = Math.round(Number(searchParams.get("subtotalCents") ?? 0));

    if (subtotalCents <= 0) {
      return NextResponse.json({ error: "subtotalCents inválido" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: { id: true, organizationId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    const feeResult = await FinancialEngine.calculateServiceFee({
      ticketPriceCents: subtotalCents,
      organizationId: event.organizationId ?? undefined,
    });
    const config = await FinancialEngine.resolveEffectiveConfig(event.organizationId ?? undefined);
    const feePaidBy = config.feePaidBy;
    const totalCents =
      feePaidBy === "BUYER" ? subtotalCents + feeResult.serviceFeeCents : subtotalCents;

    return NextResponse.json({
      subtotalCents,
      serviceFeeCents: feeResult.serviceFeeCents,
      feePaidBy,
      totalCents,
    });
  } catch (error) {
    console.error("[GET /api/events/[slug]/checkout-preview]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
