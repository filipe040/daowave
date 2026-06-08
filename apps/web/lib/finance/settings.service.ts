import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { decimalToNumber } from "./fee-calculator";
import type { EnterpriseFinancialSettings, FinancialSettingsInput } from "./types";

function rowToEnterprise(row: {
  buyerFeePercent: { toNumber(): number } | number;
  buyerFeeFixedCents: number;
  platformCommissionPercent: { toNumber(): number } | number;
  reserveFundPercent: { toNumber(): number } | number;
  minWithdrawalCents: number;
  pendingReleaseDays: number;
  autoApproveWithdrawals: boolean;
  currency: string;
  serviceFeeType: "PERCENTAGE" | "FIXED";
  serviceFeeValue: { toNumber(): number } | number;
  dynamicServiceFee: boolean;
  minimumProfitPerOrderCents: number;
  chargebackProtectionEnabled: boolean;
  automaticPayoutsEnabled: boolean;
  defaultVatPercent: { toNumber(): number } | number;
}): EnterpriseFinancialSettings {
  return {
    buyerFeePercent: decimalToNumber(row.buyerFeePercent),
    buyerFeeFixedCents: row.buyerFeeFixedCents,
    platformCommissionPercent: decimalToNumber(row.platformCommissionPercent),
    reserveFundPercent: decimalToNumber(row.reserveFundPercent),
    minWithdrawalCents: row.minWithdrawalCents,
    pendingReleaseDays: row.pendingReleaseDays,
    autoApproveWithdrawals: row.autoApproveWithdrawals,
    currency: row.currency,
    serviceFeeType: row.serviceFeeType,
    serviceFeeValue: decimalToNumber(row.serviceFeeValue),
    dynamicServiceFee: row.dynamicServiceFee,
    minimumProfitPerOrderCents: row.minimumProfitPerOrderCents,
    chargebackProtectionEnabled: row.chargebackProtectionEnabled,
    automaticPayoutsEnabled: row.automaticPayoutsEnabled,
    defaultVatPercent: decimalToNumber(row.defaultVatPercent),
  };
}

export class FinancialSettingsService {
  static async get(tx?: Prisma.TransactionClient): Promise<EnterpriseFinancialSettings> {
    const client = tx ?? prisma;
    let row = await client.financialSettings.findUnique({ where: { id: "default" } });
    if (!row) {
      row = await client.financialSettings.create({ data: { id: "default" } });
    }
    return rowToEnterprise(row);
  }

  static async getLegacy(): Promise<FinancialSettingsInput> {
    const s = await FinancialSettingsService.get();
    return {
      buyerFeePercent: s.buyerFeePercent,
      buyerFeeFixedCents: s.buyerFeeFixedCents,
      platformCommissionPercent: s.platformCommissionPercent,
      reserveFundPercent: s.reserveFundPercent,
      minWithdrawalCents: s.minWithdrawalCents,
      pendingReleaseDays: s.pendingReleaseDays,
      autoApproveWithdrawals: s.autoApproveWithdrawals,
      currency: s.currency,
    };
  }

  static async update(
    data: Partial<EnterpriseFinancialSettings> & { updatedByUserId?: string },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    const before = await client.financialSettings.findUnique({ where: { id: "default" } });
    const updated = await client.financialSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...data },
      update: {
        ...data,
        ...(data.automaticPayoutsEnabled !== undefined && {
          autoApproveWithdrawals: data.automaticPayoutsEnabled,
        }),
      },
    });
    await client.financialAuditLog.create({
      data: {
        action: "SETTINGS_UPDATED",
        entityType: "FinancialSettings",
        entityId: "default",
        beforeJson: before as unknown as Prisma.InputJsonValue,
        afterJson: updated as unknown as Prisma.InputJsonValue,
        actorUserId: data.updatedByUserId,
      },
    });
    return updated;
  }

  static async getForOrganization(organizationId: string): Promise<EnterpriseFinancialSettings> {
    const [global, override] = await Promise.all([
      FinancialSettingsService.get(),
      prisma.promoterFinancialSettings.findUnique({ where: { organizationId } }),
    ]);
    if (!override) return global;
    return {
      ...global,
      ...(override.serviceFeeMode && {
        serviceFeeType: override.serviceFeeMode,
        serviceFeeValue: override.serviceFeeValue
          ? decimalToNumber(override.serviceFeeValue)
          : global.serviceFeeValue,
      }),
      ...(override.reservePercentage != null && {
        reserveFundPercent: decimalToNumber(override.reservePercentage),
      }),
      ...(override.minimumProfitPerOrderCents != null && {
        minimumProfitPerOrderCents: override.minimumProfitPerOrderCents,
      }),
      ...(override.payoutDelayDays != null && {
        pendingReleaseDays: override.payoutDelayDays,
      }),
    };
  }
}
