import { percentOfCents } from "./fee-calculator";
import type { PaymentMethodFees } from "./payment-method.service";
import { PaymentMethodService } from "./payment-method.service";

export class ProfitBelowMinimumError extends Error {
  constructor(
    public readonly netProfitCents: number,
    public readonly minimumCents: number,
    public readonly suggestedServiceFeeCents: number
  ) {
    super(
      `Lucro líquido (${(netProfitCents / 100).toFixed(2)}€) abaixo do mínimo (${(minimumCents / 100).toFixed(2)}€)`
    );
    this.name = "ProfitBelowMinimumError";
  }
}

export interface EnterpriseSettings {
  serviceFeeType: "PERCENTAGE" | "FIXED";
  serviceFeeValue: number;
  reservePercentage: number;
  dynamicServiceFee: boolean;
  minimumProfitPerOrderCents: number;
  defaultVatPercent: number;
}

export interface EnterpriseSplitInput {
  ticketPriceCents: number;
  paymentMethod: PaymentMethodFees;
  settings: EnterpriseSettings;
  /** Se true, ajusta taxa de serviço em vez de falhar */
  autoAdjustServiceFee?: boolean;
  /** Forçar validação anti-prejuízo */
  enforceMinimumProfit?: boolean;
}

export interface EnterpriseSplitResult {
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
  serviceFeeAdjusted: boolean;
}

export function calculateEnterpriseSplit(input: EnterpriseSplitInput): EnterpriseSplitResult {
  const ticket = input.ticketPriceCents;
  const gatewayFeeCents = PaymentMethodService.calculateGatewayFeeCents(ticket, input.paymentMethod);
  const minProfit = input.settings.minimumProfitPerOrderCents;

  let serviceFeeCents =
    input.settings.serviceFeeType === "PERCENTAGE"
      ? percentOfCents(ticket, input.settings.serviceFeeValue)
      : Math.round(input.settings.serviceFeeValue * 100);

  let serviceFeeAdjusted = false;

  if (input.settings.dynamicServiceFee) {
    const minRequired = gatewayFeeCents + minProfit;
    if (serviceFeeCents < minRequired) {
      serviceFeeCents = minRequired;
      serviceFeeAdjusted = true;
    }
  }

  const netPlatformProfitCents = serviceFeeCents - gatewayFeeCents;
  const reserveCents = percentOfCents(ticket, input.settings.reservePercentage);
  const promoterNetCents = ticket - reserveCents;

  if (promoterNetCents < 0) {
    throw new Error("Reserva excede o valor do bilhete");
  }

  const enforce = input.enforceMinimumProfit !== false;
  if (enforce && netPlatformProfitCents < minProfit) {
    const suggested = gatewayFeeCents + minProfit;
    if (input.autoAdjustServiceFee) {
      serviceFeeCents = suggested;
      serviceFeeAdjusted = true;
    } else {
      throw new ProfitBelowMinimumError(netPlatformProfitCents, minProfit, suggested);
    }
  }

  const finalNetProfit = serviceFeeCents - gatewayFeeCents;
  const vatBase = serviceFeeCents;
  const vatCents = percentOfCents(vatBase, input.settings.defaultVatPercent);
  const totalCustomerCents = ticket + serviceFeeCents + vatCents;
  const marginPercent = serviceFeeCents > 0 ? (finalNetProfit / serviceFeeCents) * 100 : 0;

  return {
    ticketPriceCents: ticket,
    serviceFeeCents,
    gatewayFeeCents,
    vatCents,
    totalCustomerCents,
    reserveCents,
    promoterNetCents,
    platformGrossCents: serviceFeeCents,
    netPlatformProfitCents: finalNetProfit,
    marginPercent: Math.round(marginPercent * 100) / 100,
    paymentMethodCode: input.paymentMethod.code,
    serviceFeeAdjusted,
  };
}

/** Simulador financeiro (admin) */
export function simulateFinancialScenario(params: {
  ticketPriceEuros: number;
  paymentMethodCode: string;
  paymentMethod: PaymentMethodFees;
  settings: EnterpriseSettings;
  commissionPercent?: number;
}): EnterpriseSplitResult & {
  commissionCents: number;
  breakdown: Record<string, string>;
} {
  const ticketCents = Math.round(params.ticketPriceEuros * 100);
  const split = calculateEnterpriseSplit({
    ticketPriceCents: ticketCents,
    paymentMethod: params.paymentMethod,
    settings: params.settings,
    autoAdjustServiceFee: true,
  });

  const commissionCents = params.commissionPercent
    ? percentOfCents(ticketCents, params.commissionPercent)
    : 0;

  const fmt = (c: number) => `${(c / 100).toFixed(2)}€`;

  return {
    ...split,
    commissionCents,
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
    },
  };
}
