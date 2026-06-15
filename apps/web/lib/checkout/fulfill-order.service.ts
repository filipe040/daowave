/**
 * Idempotent order fulfillment — single source of truth for ticket issuance after payment.
 */

import { prisma } from "@/lib/prisma";
import { generateTicketCode } from "@/lib/utils";
import { getQRPayload } from "@/lib/qr/generate";
import { sendTicketsEmail } from "@/lib/email-service";
import { recordCouponCommission } from "@/lib/coupons/coupon-commission";
import { validateCouponForCheckout } from "@/lib/coupons/validate-coupon";
import { OrderFinanceService } from "@/lib/finance";
import { InventoryService } from "@/lib/services/inventory.service";
import type { PaymentProviderKind } from "@prisma/client";

export type FulfillOrderInput = {
  paymentRef: string;
  paymentProviderName: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string | null;
  couponId?: string;
  paymentMethodCode?: string;
  skipEmail?: boolean;
};

export type FulfillOrderResult = {
  orderId: string;
  alreadyFulfilled: boolean;
  ticketsIssued: number;
};

const PROVIDER_MAP: Record<string, PaymentProviderKind> = {
  stripe: "STRIPE",
  STRIPE: "STRIPE",
  eupago: "EUPAGO",
  EUPAGO: "EUPAGO",
  mbway: "MBWAY",
  MBWAY: "MBWAY",
  multibanco: "MULTIBANCO",
  MULTIBANCO: "MULTIBANCO",
  paypal: "PAYPAL",
  PAYPAL: "PAYPAL",
  manual: "MANUAL",
  mock: "MANUAL",
  MOCK: "MANUAL",
};

const METHOD_CODE_MAP: Record<string, string> = {
  mock: "MBWAY",
  mbway: "MBWAY",
  MBWAY: "MBWAY",
  multibanco: "MULTIBANCO",
  MULTIBANCO: "MULTIBANCO",
  stripe: "VISA",
  eupago: "MBWAY",
  EUPAGO: "MBWAY",
  paypal: "VISA",
  PAYPAL: "VISA",
};

export async function fulfillPaidOrder(
  orderId: string,
  input: FulfillOrderInput
): Promise<FulfillOrderResult> {
  const existingTickets = await prisma.ticket.count({ where: { orderId } });
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { ticketLot: true } },
      event: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "PAID" && existingTickets > 0) {
    return { orderId, alreadyFulfilled: true, ticketsIssued: existingTickets };
  }

  let verifiedDiscount = 0;
  let couponApplied = false;
  const baseTotal = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0
  );

  if (input.couponId) {
    const couponResult = await validateCouponForCheckout({
      couponId: input.couponId,
      eventId: order.eventId,
      totalCents: baseTotal,
    });
    if (couponResult.ok) {
      couponApplied = true;
      verifiedDiscount = couponResult.discountCents;
    }
  }

  const finalTotal = Math.max(0, baseTotal - verifiedDiscount);

  const holds = await prisma.inventoryHold.findMany({
    where: {
      userId: order.userId,
      eventId: order.eventId,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (holds.length > 0) {
    await InventoryService.confirmHolds(holds.map((h) => h.id));
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        ...(input.buyerName ? { buyerName: input.buyerName } : {}),
        ...(input.buyerEmail ? { buyerEmail: input.buyerEmail } : {}),
        ...(input.buyerPhone !== undefined ? { buyerPhone: input.buyerPhone } : {}),
        status: "PAID",
        paidAt: new Date(),
        paymentProvider: input.paymentProviderName,
        paymentRef: input.paymentRef,
        totalCents: finalTotal,
      },
    });

    if (input.couponId && couponApplied) {
      await tx.coupon.update({
        where: { id: input.couponId },
        data: { usedCount: { increment: 1 } },
      });
      await recordCouponCommission(tx, input.couponId, order.id);
    }

    const existingCount = await tx.ticket.count({ where: { orderId: order.id } });
    if (existingCount > 0) return;

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

  const ticketsIssued = await prisma.ticket.count({ where: { orderId } });

  try {
    const methodCode = input.paymentMethodCode?.toUpperCase();
    await OrderFinanceService.processOrderPayment(order.id, {
      paymentProvider: PROVIDER_MAP[input.paymentProviderName] ?? "MANUAL",
      paymentMethodCode:
        methodCode ?? METHOD_CODE_MAP[input.paymentProviderName] ?? "MBWAY",
      idempotencyKey: `order-payment:${order.id}`,
    });
  } catch (financeErr) {
    console.error("[fulfill-order] Finance ledger error:", financeErr);
  }

  if (!input.skipEmail) {
    try {
      await sendTicketsEmail(order.id);
    } catch (emailErr) {
      console.error("[fulfill-order] Error sending ticket email:", emailErr);
    }
  }

  return { orderId, alreadyFulfilled: false, ticketsIssued };
}
