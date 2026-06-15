import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { isStripePaymentsEnabled } from "@/lib/payment";
import { validateCouponForCheckout } from "@/lib/coupons/validate-coupon";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import { z } from "zod";

const BodySchema = z.object({
  couponId: z.string().uuid().optional(),
  discountCents: z.number().int().min(0).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const rateLimitRes = await applyRateLimit(request, RATE_LIMITS.checkout);
    if (rateLimitRes) return rateLimitRes;

    if (!isStripePaymentsEnabled() || !stripe) {
      return NextResponse.json({ error: "Pagamentos Stripe não ativos" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    let body: z.infer<typeof BodySchema> = {};
    try {
      const json = await request.json();
      body = BodySchema.parse(json);
    } catch {
      // body opcional
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (order.status === "PAID") {
      return NextResponse.json({ error: "Encomenda já paga" }, { status: 400 });
    }

    const subtotal = order.items.reduce((s, i) => s + i.quantity * i.unitPriceCents, 0);
    let discount = 0;
    if (body.couponId) {
      const couponResult = await validateCouponForCheckout({
        couponId: body.couponId,
        eventId: order.eventId,
        totalCents: subtotal,
      });
      if (couponResult.ok) discount = couponResult.discountCents;
    }

    const serviceFee = order.serviceFeeCents ?? 0;
    const feePaidBy = order.feePaidBy ?? "BUYER";
    const feeToCharge = feePaidBy === "BUYER" ? serviceFee : 0;
    const amount = Math.max(0, subtotal + feeToCharge - discount);

    if (amount < 50) {
      return NextResponse.json({ error: "Valor mínimo de pagamento inválido" }, { status: 400 });
    }

    const stripeClient = stripe as Stripe;
    if (!stripeClient?.paymentIntents) {
      return NextResponse.json({ error: "Stripe não configurado" }, { status: 500 });
    }

    let paymentIntent;
    if (order.paymentRef?.startsWith("pi_")) {
      try {
        paymentIntent = await stripeClient.paymentIntents.retrieve(order.paymentRef);
        if (paymentIntent.status !== "succeeded" && paymentIntent.amount !== amount) {
          paymentIntent = await stripeClient.paymentIntents.update(order.paymentRef, { amount });
        }
      } catch {
        paymentIntent = null;
      }
    }

    if (!paymentIntent || paymentIntent.status === "succeeded") {
      paymentIntent = await stripeClient.paymentIntents.create({
        amount,
        currency: (order.currency || "EUR").toLowerCase(),
        metadata: {
          orderId: order.id,
          eventId: order.eventId,
          userId: session.user.id,
        },
        automatic_payment_methods: { enabled: true },
      });
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: "stripe",
        paymentRef: paymentIntent.id,
        totalCents: amount,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
    });
  } catch (error) {
    console.error("[payment-intent]", error);
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 });
  }
}
