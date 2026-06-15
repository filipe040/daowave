/**
 * POST /api/checkout/[orderId]/confirm
 * Validate buyer info, confirm payment, issue tickets (idempotent).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider, isMockPaymentsEnabled } from "@/lib/payment";
import { checkoutConfirmSchema } from "@/lib/security/validation";
import { sendTicketsEmail } from "@/lib/email-service";
import { fulfillPaidOrder } from "@/lib/checkout/fulfill-order.service";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const rateLimitRes = await applyRateLimit(request, RATE_LIMITS.checkout);
    if (rateLimitRes) return rateLimitRes;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (body === null || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const validated = checkoutConfirmSchema.parse({
      buyerName: b.buyerName,
      buyerEmail: b.buyerEmail,
      buyerPhone: b.buyerPhone,
      paymentMock: b.paymentMock,
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.status === "PAID") {
      sendTicketsEmail(order.id, {
        idempotencyKey: `ticket-delivery-resend-${order.id}-${Date.now()}`,
      }).catch((err) =>
        console.error("[checkout/confirm] resend ticket email error:", err)
      );
      return NextResponse.json({
        success: true,
        orderId: order.id,
        message: "Order already paid",
      });
    }

    const paymentMock = validated.paymentMock === true;
    const paymentIntentId = b.paymentIntentId as string | undefined;

    if (paymentMock && !isMockPaymentsEnabled()) {
      return NextResponse.json(
        { error: "Pagamentos simulados não estão disponíveis" },
        { status: 403 }
      );
    }

    let paymentRef: string;
    let paymentProviderName: string;

    if (paymentMock) {
      paymentRef = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      paymentProviderName = "mock";
    } else if (paymentIntentId) {
      const provider = getPaymentProvider();
      const result = await provider.confirmPayment(paymentIntentId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Payment failed" },
          { status: 400 }
        );
      }
      paymentRef = result.paymentRef;
      paymentProviderName = "stripe";
    } else {
      return NextResponse.json(
        { error: "Provide paymentMock: true or paymentIntentId" },
        { status: 400 }
      );
    }

    const couponId = typeof b.couponId === "string" ? b.couponId : undefined;
    const bodyMethod =
      typeof b.paymentMethodCode === "string" ? b.paymentMethodCode : undefined;

    const result = await fulfillPaidOrder(orderId, {
      paymentRef,
      paymentProviderName,
      buyerName: validated.buyerName,
      buyerEmail: validated.buyerEmail,
      buyerPhone: validated.buyerPhone ?? null,
      couponId,
      paymentMethodCode: bodyMethod,
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      ticketsIssued: result.ticketsIssued,
      message: result.alreadyFulfilled
        ? "Order already paid"
        : "Payment confirmed and tickets issued",
    });
  } catch (error: unknown) {
    const err = error as { name?: string; errors?: unknown };
    if (err.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 }
      );
    }
    console.error("Checkout confirm error:", error);
    return NextResponse.json(
      { error: "Failed to confirm order" },
      { status: 500 }
    );
  }
}
