import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

/** Regista comissão quando o cupão está atribuído a um membro da equipa. */
export async function recordCouponCommission(
  tx: Tx,
  couponId: string,
  orderId: string
): Promise<void> {
  const coupon = await tx.coupon.findUnique({
    where: { id: couponId },
    select: {
      assignedMemberId: true,
      commissionCents: true,
    },
  });

  if (!coupon?.assignedMemberId || !coupon.commissionCents || coupon.commissionCents <= 0) {
    return;
  }

  await tx.couponCommission.create({
    data: {
      couponId,
      orderId,
      memberId: coupon.assignedMemberId,
      amountCents: coupon.commissionCents,
    },
  });
}
