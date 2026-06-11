import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { decimalToNumber } from "./fee-calculator";
import { FinancialEngine } from "./financial-engine";
import type { EnterpriseFinancialSettings, FinancialSettingsInput, PromoterFinancialProfile } from "./types";

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
  pricingMode: "FORMULA" | "TIERED";
  serviceFeeFixedCents: number;
  minimumServiceFeeCents: number;
  maximumServiceFeeCents: number | null;
  operationalReserveCents: number;
  roundingMode: "NONE" | "END_49" | "END_99" | "END_49_99";
  absorbPaymentFees: boolean;
  defaultFeePaidBy: "BUYER" | "ORGANIZER";
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
    pricingMode: row.pricingMode,
    serviceFeeFixedCents: row.serviceFeeFixedCents,
    minimumServiceFeeCents: row.minimumServiceFeeCents,
    maximumServiceFeeCents: row.maximumServiceFeeCents,
    operationalReserveCents: row.operationalReserveCents,
    roundingMode: row.roundingMode,
    absorbPaymentFees: row.absorbPaymentFees,
    defaultFeePaidBy: row.defaultFeePaidBy,
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
    FinancialEngine.clearConfigCache();
    return updated;
  }

  static async getPromoterProfile(organizationId: string): Promise<PromoterFinancialProfile | null> {
    const row = await prisma.promoterFinancialSettings.findUnique({ where: { organizationId } });
    if (!row) return null;
    return {
      organizationId: row.organizationId,
      pricingMode: row.pricingMode,
      customFixedFeeCents: row.customFixedFeeCents,
      customPercentageFee: row.customPercentageFee ? decimalToNumber(row.customPercentageFee) : null,
      customMinimumFeeCents: row.customMinimumFeeCents,
      customMaximumFeeCents: row.customMaximumFeeCents,
      customOperationalReserveCents: row.customOperationalReserveCents,
      feePaidBy: row.feePaidBy,
      settlementFrequency: row.settlementFrequency,
      lastSettlementAt: row.lastSettlementAt?.toISOString() ?? null,
      active: row.active,
      serviceFeeMode: row.serviceFeeMode,
      serviceFeeValue: row.serviceFeeValue ? decimalToNumber(row.serviceFeeValue) : null,
      reservePercentage: row.reservePercentage ? decimalToNumber(row.reservePercentage) : null,
      minimumProfitPerOrderCents: row.minimumProfitPerOrderCents,
      payoutDelayDays: row.payoutDelayDays,
    };
  }

  static async upsertPromoterProfile(
    organizationId: string,
    data: Partial<PromoterFinancialProfile> & { updatedByUserId?: string }
  ) {
    const before = await prisma.promoterFinancialSettings.findUnique({ where: { organizationId } });
    const updated = await prisma.promoterFinancialSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        pricingMode: data.pricingMode ?? "GLOBAL",
        customFixedFeeCents: data.customFixedFeeCents,
        customPercentageFee: data.customPercentageFee,
        customMinimumFeeCents: data.customMinimumFeeCents,
        customMaximumFeeCents: data.customMaximumFeeCents,
        customOperationalReserveCents: data.customOperationalReserveCents,
        feePaidBy: data.feePaidBy,
        settlementFrequency: data.settlementFrequency ?? "MANUAL",
        active: data.active ?? true,
        serviceFeeMode: data.serviceFeeMode,
        serviceFeeValue: data.serviceFeeValue,
        reservePercentage: data.reservePercentage,
        minimumProfitPerOrderCents: data.minimumProfitPerOrderCents,
        payoutDelayDays: data.payoutDelayDays,
      },
      update: {
        ...(data.pricingMode !== undefined && { pricingMode: data.pricingMode }),
        ...(data.customFixedFeeCents !== undefined && { customFixedFeeCents: data.customFixedFeeCents }),
        ...(data.customPercentageFee !== undefined && { customPercentageFee: data.customPercentageFee }),
        ...(data.customMinimumFeeCents !== undefined && { customMinimumFeeCents: data.customMinimumFeeCents }),
        ...(data.customMaximumFeeCents !== undefined && { customMaximumFeeCents: data.customMaximumFeeCents }),
        ...(data.customOperationalReserveCents !== undefined && {
          customOperationalReserveCents: data.customOperationalReserveCents,
        }),
        ...(data.feePaidBy !== undefined && { feePaidBy: data.feePaidBy }),
        ...(data.settlementFrequency !== undefined && { settlementFrequency: data.settlementFrequency }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.serviceFeeMode !== undefined && { serviceFeeMode: data.serviceFeeMode }),
        ...(data.serviceFeeValue !== undefined && { serviceFeeValue: data.serviceFeeValue }),
        ...(data.reservePercentage !== undefined && { reservePercentage: data.reservePercentage }),
        ...(data.minimumProfitPerOrderCents !== undefined && {
          minimumProfitPerOrderCents: data.minimumProfitPerOrderCents,
        }),
        ...(data.payoutDelayDays !== undefined && { payoutDelayDays: data.payoutDelayDays }),
      },
    });
    await prisma.financialAuditLog.create({
      data: {
        action: "PROMOTER_SETTINGS_UPDATED",
        entityType: "PromoterFinancialSettings",
        entityId: organizationId,
        beforeJson: before as unknown as Prisma.InputJsonValue,
        afterJson: updated as unknown as Prisma.InputJsonValue,
        actorUserId: data.updatedByUserId,
      },
    });
    FinancialEngine.clearConfigCache();
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
