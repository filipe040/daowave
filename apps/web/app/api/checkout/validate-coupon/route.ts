/**
 * POST /api/checkout/validate-coupon
 * Validates a coupon code for a given event and returns the discount details.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  code: z.string().min(1),
  eventId: z.string().uuid(),
  totalCents: z.number().positive(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, eventId, totalCents } = Schema.parse(body);

    const now = new Date();

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        eventId,
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupão inválido ou expirado" }, { status: 404 });
    }

    // Check usage limit
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Este cupão atingiu o limite de utilizações" }, { status: 400 });
    }

    // Calculate discount
    let discountCents = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discountCents = Math.floor((totalCents * coupon.discountValue) / 100);
    } else {
      // FIXED — stored in cents
      discountCents = Math.min(coupon.discountValue, totalCents);
    }

    const finalCents = Math.max(0, totalCents - discountCents);

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountCents,
      finalCents,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[validate-coupon]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
