import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { FinancialEngine } from "./financial-engine";
import type { CommissionTierInput } from "./types";

export class CommissionTierService {
  static async list(activeOnly = false) {
    return prisma.commissionTier.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });
  }

  static async create(data: CommissionTierInput, actorUserId?: string) {
    const tier = await prisma.commissionTier.create({
      data: {
        minPriceCents: data.minPriceCents,
        maxPriceCents: data.maxPriceCents,
        fixedFeeCents: data.fixedFeeCents,
        percentageFee: data.percentageFee,
        active: data.active ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    await prisma.financialAuditLog.create({
      data: {
        action: "COMMISSION_TIER_CREATED",
        entityType: "CommissionTier",
        entityId: tier.id,
        afterJson: tier as unknown as Prisma.InputJsonValue,
        actorUserId,
      },
    });
    FinancialEngine.clearConfigCache();
    return tier;
  }

  static async update(id: string, data: Partial<CommissionTierInput>, actorUserId?: string) {
    const before = await prisma.commissionTier.findUnique({ where: { id } });
    const tier = await prisma.commissionTier.update({ where: { id }, data });
    await prisma.financialAuditLog.create({
      data: {
        action: "COMMISSION_TIER_UPDATED",
        entityType: "CommissionTier",
        entityId: id,
        beforeJson: before as unknown as Prisma.InputJsonValue,
        afterJson: tier as unknown as Prisma.InputJsonValue,
        actorUserId,
      },
    });
    FinancialEngine.clearConfigCache();
    return tier;
  }

  static async delete(id: string, actorUserId?: string) {
    const before = await prisma.commissionTier.findUnique({ where: { id } });
    await prisma.commissionTier.delete({ where: { id } });
    await prisma.financialAuditLog.create({
      data: {
        action: "COMMISSION_TIER_DELETED",
        entityType: "CommissionTier",
        entityId: id,
        beforeJson: before as unknown as Prisma.InputJsonValue,
        actorUserId,
      },
    });
    FinancialEngine.clearConfigCache();
  }
}
