import { prisma } from "@/lib/prisma";
import type { SettlementFrequency } from "@prisma/client";
import { FinancialSettingsService } from "./settings.service";
import { WalletService } from "./wallet.service";
import { WithdrawalService } from "./withdrawal.service";

const FREQUENCY_MS: Record<Exclude<SettlementFrequency, "MANUAL">, number> = {
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  BIWEEKLY: 14 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
};

export class AutoSettlementService {
  static isDue(frequency: SettlementFrequency, lastSettlementAt: Date | null): boolean {
    if (frequency === "MANUAL") return false;
    if (!lastSettlementAt) return true;
    const elapsed = Date.now() - lastSettlementAt.getTime();
    return elapsed >= FREQUENCY_MS[frequency];
  }

  static async run() {
    const settings = await FinancialSettingsService.get();
    const profiles = await prisma.promoterFinancialSettings.findMany({
      where: {
        active: true,
        settlementFrequency: { not: "MANUAL" },
      },
      include: { organization: { select: { id: true, name: true } } },
    });

    let processed = 0;
    let created = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      if (!this.isDue(profile.settlementFrequency, profile.lastSettlementAt)) continue;
      processed++;

      try {
        const wallet = await prisma.wallet.findFirst({
          where: { organizationId: profile.organizationId, type: "PROMOTER", deletedAt: null },
        });
        if (!wallet) continue;

        const balances = await WalletService.getBalances(wallet.id);
        if (balances.availableCents < settings.minWithdrawalCents) continue;

        await WithdrawalService.requestWithdrawal({
          organizationId: profile.organizationId,
          amountCents: balances.availableCents,
        });

        await prisma.promoterFinancialSettings.update({
          where: { organizationId: profile.organizationId },
          data: { lastSettlementAt: new Date() },
        });

        await prisma.financialAuditLog.create({
          data: {
            action: "AUTO_SETTLEMENT_CREATED",
            entityType: "PromoterFinancialSettings",
            entityId: profile.organizationId,
            afterJson: {
              amountCents: balances.availableCents,
              frequency: profile.settlementFrequency,
            },
          },
        });

        created++;
      } catch (err) {
        errors.push(
          `${profile.organizationId}: ${err instanceof Error ? err.message : "erro desconhecido"}`
        );
      }
    }

    return { processed, created, errors };
  }
}
