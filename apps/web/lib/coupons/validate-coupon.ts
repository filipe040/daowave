import { prisma } from "@/lib/prisma";
import type { Coupon } from "@prisma/client";

import { parseDatetimeLocalLisbon } from "../datetime/lisbon";

export function normalizeCouponCode(code: string): string {
  return code.toUpperCase().trim().replace(/\s/g, "");
}

/** Interpreta datetime-local como hora de Portugal (Europe/Lisbon). */
export function parseCouponDatetimeLocal(value: string, boundary: "start" | "end"): Date {
  return parseDatetimeLocalLisbon(value, boundary);
}

export function isWithinCouponPeriod(
  startsAt: Date,
  endsAt: Date,
  now: Date = new Date()
): boolean {
  return now.getTime() >= startsAt.getTime() && now.getTime() <= endsAt.getTime();
}

function calculateDiscountCents(coupon: Coupon, totalCents: number): number {
  if (coupon.discountType === "PERCENTAGE") {
    return Math.floor((totalCents * coupon.discountValue) / 100);
  }
  return Math.min(coupon.discountValue, totalCents);
}

export type CouponValidationFailure = {
  ok: false;
  error: string;
  status: number;
};

export type CouponValidationSuccess = {
  ok: true;
  coupon: Coupon;
  discountCents: number;
  finalCents: number;
};

export type CouponValidationResult = CouponValidationFailure | CouponValidationSuccess;

export async function validateCouponForCheckout(params: {
  code?: string;
  couponId?: string;
  eventId: string;
  totalCents: number;
}): Promise<CouponValidationResult> {
  const event = await prisma.event.findUnique({
    where: { id: params.eventId },
    select: { id: true, organizationId: true, title: true },
  });

  if (!event) {
    return { ok: false, error: "Evento não encontrado", status: 404 };
  }

  let coupon: Coupon | null = null;

  if (params.couponId) {
    coupon = await prisma.coupon.findUnique({ where: { id: params.couponId } });
  } else if (params.code) {
    coupon = await prisma.coupon.findUnique({
      where: { code: normalizeCouponCode(params.code) },
    });
  } else {
    return { ok: false, error: "Código de cupão em falta", status: 400 };
  }

  if (!coupon) {
    return { ok: false, error: "Cupão inválido ou expirado", status: 404 };
  }

  if (!coupon.isActive) {
    return { ok: false, error: "Este cupão está inativo", status: 400 };
  }

  const now = new Date();
  if (now.getTime() < coupon.startsAt.getTime()) {
    return { ok: false, error: "Este cupão ainda não está ativo", status: 400 };
  }
  if (now.getTime() > coupon.endsAt.getTime()) {
    return { ok: false, error: "Cupão expirado", status: 400 };
  }

  const appliesToEvent =
    coupon.eventId === event.id ||
    (event.organizationId != null && coupon.organizationId === event.organizationId);

  if (!appliesToEvent) {
    return {
      ok: false,
      error: `Este cupão não é válido para o evento «${event.title}»`,
      status: 400,
    };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return {
      ok: false,
      error: "Este cupão atingiu o limite de utilizações",
      status: 400,
    };
  }

  const discountCents = calculateDiscountCents(coupon, params.totalCents);
  const finalCents = Math.max(0, params.totalCents - discountCents);

  return {
    ok: true,
    coupon,
    discountCents,
    finalCents,
  };
}
