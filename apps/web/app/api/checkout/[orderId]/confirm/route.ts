/**
 * POST /api/checkout/[orderId]/confirm
 * Step 2: Validate buyer (buyerName, buyerEmail required), then confirm payment and issue tickets.
 * Body: { buyerName, buyerEmail, buyerPhone?, paymentMock?: boolean, paymentIntentId?: string }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payment";
import { generateTicketCode } from "@/lib/utils";
import { getQRPayload } from "@/lib/qr/generate";
import { checkoutConfirmSchema } from "@/lib/security/validation";
import { sendTicketsEmail } from "@/lib/email-service";
import { recordCouponCommission } from "@/lib/coupons/coupon-commission";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
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
      include: {
        items: { include: { ticketLot: true } },
        event: true,
      },
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
      paymentProviderName = "stripe"; // or from provider
    } else {
      return NextResponse.json(
        { error: "Provide paymentMock: true or paymentIntentId" },
        { status: 400 }
      );
    }

    // Validate coupon server-side (if provided)
    const couponId = typeof b.couponId === "string" ? b.couponId : undefined;
    let verifiedDiscount = 0;
    let couponApplied = false;

    if (couponId) {
      const now = new Date();
      const coupon = await prisma.coupon.findFirst({
        where: {
          id: couponId,
          eventId: order.eventId,
          isActive: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
        },
      });

      if (coupon) {
        if (coupon.maxUses === null || coupon.usedCount < coupon.maxUses) {
          couponApplied = true;
          const baseTotal = order.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPriceCents,
            0
          );
          if (coupon.discountType === "PERCENTAGE") {
            verifiedDiscount = Math.floor((baseTotal * coupon.discountValue) / 100);
          } else {
            verifiedDiscount = Math.min(coupon.discountValue, baseTotal);
          }
        }
      }
    }

    const finalTotal = Math.max(0,
      order.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0) - verifiedDiscount
    );

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          buyerName: validated.buyerName,
          buyerEmail: validated.buyerEmail,
          buyerPhone: validated.buyerPhone ?? null,
          status: "PAID",
          paymentProvider: paymentProviderName,
          paymentRef,
          totalCents: finalTotal,
        },
      });

      // Increment coupon usage + register affiliate commission
      if (couponId && couponApplied) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
        await recordCouponCommission(tx, couponId, order.id);
      }

      for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
          const code = generateTicketCode();
          const ticket = await tx.ticket.create({
            data: {
              orderId: order.id,
              eventId: order.eventId,
              userId: order.userId,
              ticketLotId: item.ticketLotId,
              code,
              qrPayload: "",
            },
          });
          const finalQRPayload = getQRPayload({ ticketId: ticket.id, code });
          await tx.ticket.update({
            where: { id: ticket.id },
            data: { qrPayload: finalQRPayload },
          });
          await tx.ticketLot.update({
            where: { id: item.ticketLotId },
            data: { quantitySold: { increment: 1 } },
          });
        }
      }
    });

    try {
      await sendTicketsEmail(order.id);
    } catch (emailErr) {
      console.error("[checkout/confirm] Error sending ticket email:", emailErr);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: "Payment confirmed and tickets issued",
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
