import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const couponAssignmentFields = {
  assignedMemberId: z.string().uuid().nullable().optional(),
  commissionCents: z.number().int().positive().nullable().optional(),
};

export async function resolveCouponAssignment(
  orgId: string,
  assignedMemberId?: string | null,
  commissionCents?: number | null
): Promise<{ assignedMemberId: string | null; commissionCents: number | null }> {
  if (!assignedMemberId) {
    return { assignedMemberId: null, commissionCents: null };
  }

  if (!commissionCents || commissionCents <= 0) {
    throw new Error("Indique a comissão em € ao atribuir o cupão a um promotor.");
  }

  const member = await prisma.organizationMember.findFirst({
    where: {
      id: assignedMemberId,
      organizationId: orgId,
      status: "ACTIVE",
    },
  });

  if (!member) {
    throw new Error("Membro da equipa não encontrado nesta organização.");
  }

  return { assignedMemberId, commissionCents };
}

export const couponInclude = {
  event: {
    select: { title: true, slug: true },
  },
  assignedMember: {
    select: {
      id: true,
      role: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  },
} as const;

export async function getCouponCommissionStats(couponId: string) {
  const agg = await prisma.couponCommission.aggregate({
    where: { couponId },
    _sum: { amountCents: true },
    _count: true,
  });

  return {
    totalCommissionCents: agg._sum.amountCents ?? 0,
    commissionCount: agg._count,
  };
}

export async function getBulkCouponCommissionStats(couponIds: string[]) {
  if (couponIds.length === 0) {
    return new Map<string, { totalCommissionCents: number; commissionCount: number }>();
  }

  const rows = await prisma.couponCommission.groupBy({
    by: ["couponId"],
    where: { couponId: { in: couponIds } },
    _sum: { amountCents: true },
    _count: true,
  });

  return new Map(
    rows.map((row) => [
      row.couponId,
      {
        totalCommissionCents: row._sum.amountCents ?? 0,
        commissionCount: row._count,
      },
    ])
  );
}
