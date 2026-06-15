import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill-order.service";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      console.error("No orderId in payment intent metadata");
      return NextResponse.json({ error: "No orderId" }, { status: 400 });
    }

    await prisma.payment.updateMany({
      where: { providerReference: paymentIntent.id },
      data: { status: "SUCCEEDED" },
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, buyerName: true, buyerEmail: true, buyerPhone: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "PAID") {
      console.log(`[stripe-webhook] Order ${orderId} already paid — skipping fulfillment`);
      return NextResponse.json({ received: true });
    }

    try {
      const result = await fulfillPaidOrder(orderId, {
        paymentRef: paymentIntent.id,
        paymentProviderName: "stripe",
        buyerName: order.buyerName ?? undefined,
        buyerEmail: order.buyerEmail ?? undefined,
        buyerPhone: order.buyerPhone,
        paymentMethodCode: "VISA",
      });
      console.log(
        `[stripe-webhook] Order ${orderId} fulfilled, tickets: ${result.ticketsIssued}`
      );
    } catch (err) {
      console.error("[stripe-webhook] Fulfillment error:", err);
      return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { providerReference: paymentIntent.id },
          data: { status: "FAILED" },
        });

        await tx.order.update({
          where: { id: orderId, status: "PENDING" },
          data: { status: "CANCELED" },
        });
      });
    }
  }

  return NextResponse.json({ received: true });
}
