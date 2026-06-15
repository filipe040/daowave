import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { FinancialEngine, type CartFeeItem } from "@/lib/finance/financial-engine";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  unitPriceCents: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const postSchema = z.object({
  items: z.array(itemSchema).min(1),
});

async function resolvePreview(slug: string, items: CartFeeItem[]) {
  const event = await prisma.event.findUnique({
    where: { slug, status: "PUBLISHED" },
    select: { id: true, organizationId: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );

  const feeResult = await FinancialEngine.calculateCartServiceFee({
    items,
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
}

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

    return resolvePreview(slug, [{ unitPriceCents: subtotalCents, quantity: 1 }]);
  } catch (error) {
    console.error("[GET /api/events/[slug]/checkout-preview]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = postSchema.parse(await req.json());
    return resolvePreview(slug, body.items);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[POST /api/events/[slug]/checkout-preview]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
