import { prisma } from "@/lib/prisma";
import type {
  FeePaidBy,
  FeeRounding,
  GlobalPricingMode,
  OrgPricingMode,
} from "@prisma/client";
import { percentOfCents, decimalToNumber } from "./fee-calculator";
import { PaymentMethodService, type PaymentMethodFees } from "./payment-method.service";
import { FinancialSettingsService } from "./settings.service";

export interface EffectiveFinancialConfig {
  pricingMode: GlobalPricingMode;
  serviceFeeFixedCents: number;
  serviceFeePercentage: number;
  minimumServiceFeeCents: number;
  maximumServiceFeeCents: number | null;
  operationalReserveCents: number;
  roundingMode: FeeRounding;
  absorbPaymentFees: boolean;
  feePaidBy: FeePaidBy;
  reserveFundPercent: number;
  defaultVatPercent: number;
  minimumProfitPerOrderCents: number;
  dynamicServiceFee: boolean;
  orgPricingMode: OrgPricingMode;
}

export interface ServiceFeeResult {
  serviceFeeCents: number;
  operationalReserveCents: number;
  paymentCostCents: number;
  appliedTierId: string | null;
  appliedCampaignId: string | null;
  pricingModeUsed: GlobalPricingMode;
  serviceFeeAdjusted: boolean;
}

export type CartFeeItem = { unitPriceCents: number; quantity: number };

export interface OrderSplitResult {
  ticketPriceCents: number;
  serviceFeeCents: number;
  gatewayFeeCents: number;
  vatCents: number;
  totalCustomerCents: number;
  reserveCents: number;
  promoterNetCents: number;
  platformGrossCents: number;
  netPlatformProfitCents: number;
  marginPercent: number;
  paymentMethodCode: string;
  feePaidBy: FeePaidBy;
  operationalReserveCents: number;
  appliedTierId: string | null;
  appliedCampaignId: string | null;
  pricingModeUsed: GlobalPricingMode;
  serviceFeeAdjusted: boolean;
}

const configCache = new Map<string, { config: EffectiveFinancialConfig; expires: number }>();
const CACHE_TTL_MS = 30_000;

function cacheKey(organizationId?: string) {
  return organizationId ?? "__global__";
}

/** Arredondamento para cima até .49 ou .99 */
export function applyFeeRounding(cents: number, mode: FeeRounding): number {
  if (mode === "NONE" || cents <= 0) return cents;

  const euros = cents / 100;
  const whole = Math.floor(euros);

  if (mode === "END_49") {
    const target = whole + 0.49;
    return Math.round((euros <= target ? target : whole + 1.49) * 100);
  }

  if (mode === "END_99") {
    const target = whole + 0.99;
    return Math.round((euros <= target ? target : whole + 1.99) * 100);
  }

  // END_49_99: alterna entre .49 e .99 conforme a parte decimal
  const frac = euros - whole;
  if (frac <= 0.49) return Math.round((whole + 0.49) * 100);
  if (frac <= 0.99) return Math.round((whole + 0.99) * 100);
  return Math.round((whole + 1.49) * 100);
}

export class FinancialEngine {
  static async resolveEffectiveConfig(
    organizationId?: string
  ): Promise<EffectiveFinancialConfig> {
    const key = cacheKey(organizationId);
    const cached = configCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.config;

    const global = await FinancialSettingsService.get();
    let config: EffectiveFinancialConfig = {
      pricingMode: global.pricingMode,
      serviceFeeFixedCents: global.serviceFeeFixedCents,
      serviceFeePercentage: global.serviceFeeValue,
      minimumServiceFeeCents: global.minimumServiceFeeCents,
      maximumServiceFeeCents: global.maximumServiceFeeCents,
      operationalReserveCents: global.operationalReserveCents,
      roundingMode: global.roundingMode,
      absorbPaymentFees: global.absorbPaymentFees,
      feePaidBy: global.defaultFeePaidBy,
      reserveFundPercent: global.reserveFundPercent,
      defaultVatPercent: global.defaultVatPercent,
      minimumProfitPerOrderCents: global.minimumProfitPerOrderCents,
      dynamicServiceFee: global.dynamicServiceFee,
      orgPricingMode: "GLOBAL",
    };

    if (organizationId) {
      const override = await prisma.promoterFinancialSettings.findUnique({
        where: { organizationId },
      });
      if (override && override.active !== false) {
        config.orgPricingMode = override.pricingMode;
        if (override.feePaidBy) config.feePaidBy = override.feePaidBy;
        if (override.pricingMode === "CUSTOM") {
          if (override.customFixedFeeCents != null) {
            config.serviceFeeFixedCents = override.customFixedFeeCents;
          }
          if (override.customPercentageFee != null) {
            config.serviceFeePercentage = decimalToNumber(override.customPercentageFee);
          }
          if (override.customMinimumFeeCents != null) {
            config.minimumServiceFeeCents = override.customMinimumFeeCents;
          }
          if (override.customMaximumFeeCents != null) {
            config.maximumServiceFeeCents = override.customMaximumFeeCents;
          }
          if (override.customOperationalReserveCents != null) {
            config.operationalReserveCents = override.customOperationalReserveCents;
          }
        }
        if (override.reservePercentage != null) {
          config.reserveFundPercent = decimalToNumber(override.reservePercentage);
        }
        if (override.minimumProfitPerOrderCents != null) {
          config.minimumProfitPerOrderCents = override.minimumProfitPerOrderCents;
        }
      }
    }

    configCache.set(key, { config, expires: Date.now() + CACHE_TTL_MS });
    return config;
  }

  static clearConfigCache() {
    configCache.clear();
  }

  static async calculateAveragePaymentCostCents(ticketPriceCents: number): Promise<number> {
    const methods = await PaymentMethodService.list(true);
    if (methods.length === 0) return 0;
    const total = methods.reduce(
      (sum, m) =>
        sum + PaymentMethodService.calculateGatewayFeeCents(ticketPriceCents, PaymentMethodService.toFees(m)),
      0
    );
    return Math.round(total / methods.length);
  }

  static async findActiveTier(ticketPriceCents: number) {
    const tiers = await prisma.commissionTier.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return (
      tiers.find(
        (t) =>
          ticketPriceCents >= t.minPriceCents &&
          (t.maxPriceCents == null || ticketPriceCents < t.maxPriceCents)
      ) ?? null
    );
  }

  static async findActiveCampaign(organizationId?: string, at = new Date()) {
    const campaigns = await prisma.feeCampaign.findMany({
      where: {
        active: true,
        startDate: { lte: at },
        endDate: { gte: at },
        OR: [{ organizationId: null }, ...(organizationId ? [{ organizationId }] : [])],
      },
      orderBy: { createdAt: "desc" },
    });

    for (const campaign of campaigns) {
      if (campaign.firstEventOnly && organizationId) {
        const eventCount = await prisma.event.count({
          where: { organizationId, status: { not: "DRAFT" } },
        });
        if (eventCount > 1) continue;
      }
      return campaign;
    }
    return null;
  }

  static applyCampaignDiscount(
    feeCents: number,
    campaign: { id: string; discountType: string; discountValue: { toNumber(): number } | number }
  ): number {
    const value = decimalToNumber(campaign.discountValue);
    switch (campaign.discountType) {
      case "ZERO_FEE":
        return 0;
      case "PERCENT_OFF_FEE":
        return Math.max(0, Math.round(feeCents * (1 - value / 100)));
      case "FIXED_FEE_OVERRIDE":
        return Math.round(value * 100);
      default:
        return feeCents;
    }
  }

  static async calculateServiceFee(params: {
    ticketPriceCents: number;
    organizationId?: string;
    at?: Date;
  }): Promise<ServiceFeeResult> {
    const { ticketPriceCents, organizationId, at = new Date() } = params;
    const config = await this.resolveEffectiveConfig(organizationId);

    let paymentCostCents = 0;
    if (config.absorbPaymentFees) {
      paymentCostCents = await this.calculateAveragePaymentCostCents(ticketPriceCents);
    }

    let serviceFeeCents = 0;
    let appliedTierId: string | null = null;
    let pricingModeUsed = config.pricingMode;
    let serviceFeeAdjusted = false;

    if (config.pricingMode === "TIERED") {
      const tier = await this.findActiveTier(ticketPriceCents);
      if (tier) {
        appliedTierId = tier.id;
        serviceFeeCents =
          tier.fixedFeeCents + percentOfCents(ticketPriceCents, decimalToNumber(tier.percentageFee));
      } else {
        pricingModeUsed = "FORMULA";
        serviceFeeCents =
          config.serviceFeeFixedCents +
          percentOfCents(ticketPriceCents, config.serviceFeePercentage) +
          paymentCostCents +
          config.operationalReserveCents;
      }
    } else {
      serviceFeeCents =
        config.serviceFeeFixedCents +
        percentOfCents(ticketPriceCents, config.serviceFeePercentage) +
        paymentCostCents +
        config.operationalReserveCents;
    }

    const rawBeforeClamp = serviceFeeCents;

    if (serviceFeeCents < config.minimumServiceFeeCents) {
      serviceFeeCents = config.minimumServiceFeeCents;
      serviceFeeAdjusted = true;
    }
    if (config.maximumServiceFeeCents != null && serviceFeeCents > config.maximumServiceFeeCents) {
      serviceFeeCents = config.maximumServiceFeeCents;
      serviceFeeAdjusted = true;
    }

    const campaign = await this.findActiveCampaign(organizationId, at);
    let appliedCampaignId: string | null = null;
    if (campaign) {
      const beforeCampaign = serviceFeeCents;
      serviceFeeCents = this.applyCampaignDiscount(serviceFeeCents, campaign);
      appliedCampaignId = campaign.id;
      if (serviceFeeCents !== beforeCampaign) serviceFeeAdjusted = true;
    }

    const beforeRounding = serviceFeeCents;
    serviceFeeCents = applyFeeRounding(serviceFeeCents, config.roundingMode);
    if (serviceFeeCents !== beforeRounding) serviceFeeAdjusted = true;

  if (rawBeforeClamp !== serviceFeeCents && !serviceFeeAdjusted) {
      serviceFeeAdjusted = true;
    }

    return {
      serviceFeeCents,
      operationalReserveCents: config.operationalReserveCents,
      paymentCostCents,
      appliedTierId,
      appliedCampaignId,
      pricingModeUsed,
      serviceFeeAdjusted,
    };
  }

  /**
   * Taxa por unidade de bilhete — cada bilhete paga a sua taxa (fixo + % do preço unitário).
   * Evita que lotes grandes partilhem uma única taxa máxima da encomenda.
   */
  static async calculateCartServiceFee(params: {
    items: CartFeeItem[];
    organizationId?: string;
    at?: Date;
  }): Promise<ServiceFeeResult> {
    const { items, organizationId, at } = params;

    let serviceFeeCents = 0;
    let operationalReserveCents = 0;
    let paymentCostCents = 0;
    let appliedTierId: string | null = null;
    let appliedCampaignId: string | null = null;
    let pricingModeUsed: GlobalPricingMode = "FORMULA";
    let serviceFeeAdjusted = false;

    for (const item of items) {
      if (item.quantity <= 0 || item.unitPriceCents <= 0) continue;

      const unitFee = await this.calculateServiceFee({
        ticketPriceCents: item.unitPriceCents,
        organizationId,
        at,
      });

      serviceFeeCents += unitFee.serviceFeeCents * item.quantity;
      operationalReserveCents += unitFee.operationalReserveCents * item.quantity;
      paymentCostCents += unitFee.paymentCostCents * item.quantity;
      appliedTierId = unitFee.appliedTierId;
      appliedCampaignId = unitFee.appliedCampaignId;
      pricingModeUsed = unitFee.pricingModeUsed;
      serviceFeeAdjusted = serviceFeeAdjusted || unitFee.serviceFeeAdjusted;
    }

    return {
      serviceFeeCents,
      operationalReserveCents,
      paymentCostCents,
      appliedTierId,
      appliedCampaignId,
      pricingModeUsed,
      serviceFeeAdjusted,
    };
  }

  static async calculateOrderSplit(params: {
    ticketPriceCents: number;
    organizationId?: string;
    paymentMethod?: PaymentMethodFees;
    paymentMethodCode?: string;
    at?: Date;
    /** Usar valores já calculados (snapshot da encomenda) */
    snapshot?: {
      serviceFeeCents: number;
      feePaidBy: FeePaidBy;
      appliedTierId?: string | null;
      appliedCampaignId?: string | null;
      pricingModeUsed?: GlobalPricingMode;
    };
  }): Promise<OrderSplitResult> {
    const config = await this.resolveEffectiveConfig(params.organizationId);
    const feePaidBy = params.snapshot?.feePaidBy ?? config.feePaidBy;

    let serviceFeeResult: ServiceFeeResult;
    if (params.snapshot) {
      serviceFeeResult = {
        serviceFeeCents: params.snapshot.serviceFeeCents,
        operationalReserveCents: config.operationalReserveCents,
        paymentCostCents: 0,
        appliedTierId: params.snapshot.appliedTierId ?? null,
        appliedCampaignId: params.snapshot.appliedCampaignId ?? null,
        pricingModeUsed: params.snapshot.pricingModeUsed ?? config.pricingMode,
        serviceFeeAdjusted: false,
      };
    } else {
      serviceFeeResult = await this.calculateServiceFee({
        ticketPriceCents: params.ticketPriceCents,
        organizationId: params.organizationId,
        at: params.at,
      });
    }

    const methodCode = params.paymentMethodCode ?? params.paymentMethod?.code ?? "MBWAY";
    let paymentMethod = params.paymentMethod;
    if (!paymentMethod) {
      try {
        paymentMethod = await PaymentMethodService.getByCode(methodCode);
      } catch {
        paymentMethod = await PaymentMethodService.getByCode("MBWAY");
      }
    }

    const gatewayFeeCents = PaymentMethodService.calculateGatewayFeeCents(
      params.ticketPriceCents,
      paymentMethod
    );

    let serviceFeeCents = serviceFeeResult.serviceFeeCents;

    if (config.dynamicServiceFee) {
      const minRequired = gatewayFeeCents + config.minimumProfitPerOrderCents;
      if (serviceFeeCents < minRequired) {
        serviceFeeCents = minRequired;
        serviceFeeResult.serviceFeeAdjusted = true;
      }
    }

    const netPlatformProfitCents = serviceFeeCents - gatewayFeeCents;
    const reserveCents = percentOfCents(params.ticketPriceCents, config.reserveFundPercent);

    let promoterNetCents: number;
    let totalCustomerCents: number;

    if (feePaidBy === "ORGANIZER") {
      totalCustomerCents = params.ticketPriceCents;
      promoterNetCents = params.ticketPriceCents - serviceFeeCents - reserveCents;
    } else {
      totalCustomerCents = params.ticketPriceCents + serviceFeeCents;
      promoterNetCents = params.ticketPriceCents - reserveCents;
    }

    if (promoterNetCents < 0) {
      throw new Error("Valor líquido do promotor negativo após taxas");
    }

    const vatCents = percentOfCents(serviceFeeCents, config.defaultVatPercent);
    const marginPercent =
      serviceFeeCents > 0
        ? Math.round(((serviceFeeCents - gatewayFeeCents) / serviceFeeCents) * 10000) / 100
        : 0;

    return {
      ticketPriceCents: params.ticketPriceCents,
      serviceFeeCents,
      gatewayFeeCents,
      vatCents,
      totalCustomerCents: feePaidBy === "BUYER" ? totalCustomerCents + vatCents : totalCustomerCents,
      reserveCents,
      promoterNetCents,
      platformGrossCents: serviceFeeCents,
      netPlatformProfitCents,
      marginPercent,
      paymentMethodCode: methodCode,
      feePaidBy,
      operationalReserveCents: serviceFeeResult.operationalReserveCents,
      appliedTierId: serviceFeeResult.appliedTierId,
      appliedCampaignId: serviceFeeResult.appliedCampaignId,
      pricingModeUsed: serviceFeeResult.pricingModeUsed,
      serviceFeeAdjusted: serviceFeeResult.serviceFeeAdjusted,
    };
  }

  /** Simulador admin */
  static async simulate(params: {
    ticketPriceEuros: number;
    organizationId?: string;
    paymentMethodCode?: string;
  }) {
    const ticketCents = Math.round(params.ticketPriceEuros * 100);
    const split = await this.calculateOrderSplit({
      ticketPriceCents: ticketCents,
      organizationId: params.organizationId,
      paymentMethodCode: params.paymentMethodCode ?? "MBWAY",
    });

    const fmt = (c: number) => `${(c / 100).toFixed(2)}€`;

    return {
      ...split,
      breakdown: {
        bilhete: fmt(split.ticketPriceCents),
        taxaServico: fmt(split.serviceFeeCents),
        taxaGateway: fmt(split.gatewayFeeCents),
        iva: fmt(split.vatCents),
        totalCliente: fmt(split.totalCustomerCents),
        reserva: fmt(split.reserveCents),
        promotor: fmt(split.promoterNetCents),
        receitaLivePass: fmt(split.platformGrossCents),
        lucroLiquido: fmt(split.netPlatformProfitCents),
        margem: `${split.marginPercent}%`,
        feePaidBy: split.feePaidBy,
      },
    };
  }
}
