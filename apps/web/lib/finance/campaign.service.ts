import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { FinancialEngine } from "./financial-engine";
import type { FeeCampaignInput } from "./types";

export class FeeCampaignService {
  static async list(activeOnly = false) {
    return prisma.feeCampaign.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { startDate: "desc" },
      include: { organization: { select: { id: true, name: true } } },
    });
  }

  static async create(data: FeeCampaignInput, actorUserId?: string) {
    const campaign = await prisma.feeCampaign.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        discountType: data.discountType,
        discountValue: data.discountValue,
        organizationId: data.organizationId,
        firstEventOnly: data.firstEventOnly ?? false,
        active: data.active ?? true,
      },
    });
    await prisma.financialAuditLog.create({
      data: {
        action: "FEE_CAMPAIGN_CREATED",
        entityType: "FeeCampaign",
        entityId: campaign.id,
        afterJson: campaign as unknown as Prisma.InputJsonValue,
        actorUserId,
      },
    });
    FinancialEngine.clearConfigCache();
    return campaign;
  }

  static async update(id: string, data: Partial<FeeCampaignInput>, actorUserId?: string) {
    const before = await prisma.feeCampaign.findUnique({ where: { id } });
    const campaign = await prisma.feeCampaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.discountType !== undefined && { discountType: data.discountType }),
        ...(data.discountValue !== undefined && { discountValue: data.discountValue }),
        ...(data.organizationId !== undefined && { organizationId: data.organizationId }),
        ...(data.firstEventOnly !== undefined && { firstEventOnly: data.firstEventOnly }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
    await prisma.financialAuditLog.create({
      data: {
        action: "FEE_CAMPAIGN_UPDATED",
        entityType: "FeeCampaign",
        entityId: id,
        beforeJson: before as unknown as Prisma.InputJsonValue,
        afterJson: campaign as unknown as Prisma.InputJsonValue,
        actorUserId,
      },
    });
    FinancialEngine.clearConfigCache();
    return campaign;
  }

  static async delete(id: string, actorUserId?: string) {
    const before = await prisma.feeCampaign.findUnique({ where: { id } });
    await prisma.feeCampaign.delete({ where: { id } });
    await prisma.financialAuditLog.create({
      data: {
        action: "FEE_CAMPAIGN_DELETED",
        entityType: "FeeCampaign",
        entityId: id,
        beforeJson: before as unknown as Prisma.InputJsonValue,
        actorUserId,
      },
    });
    FinancialEngine.clearConfigCache();
  }
}
