/**
 * POST /api/checkout/validate-coupon
 * Validates a coupon code for a given event and returns the discount details.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCouponForCheckout } from "@/lib/coupons/validate-coupon";

const Schema = z.object({
  code: z.string().min(1),
  eventId: z.string().uuid(),
  totalCents: z.number().int().min(0),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, eventId, totalCents } = Schema.parse(body);

    const result = await validateCouponForCheckout({ code, eventId, totalCents });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      coupon: {
        id: result.coupon.id,
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
      },
      discountCents: result.discountCents,
      finalCents: result.finalCents,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[validate-coupon]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
