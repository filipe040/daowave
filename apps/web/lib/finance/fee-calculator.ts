import type { FinancialSettingsInput, PaymentSplit } from "./types";

/** Percentagem com 2 casas decimais → inteiros em cêntimos */
export function percentOfCents(amountCents: number, percent: number): number {
  return Math.round((amountCents * percent) / 100);
}

export function calculatePaymentSplit(
  subtotalCents: number,
  settings: Pick<
    FinancialSettingsInput,
    "buyerFeePercent" | "buyerFeeFixedCents" | "platformCommissionPercent" | "reserveFundPercent"
  >
): PaymentSplit {
  const buyerFeeCents =
    percentOfCents(subtotalCents, settings.buyerFeePercent) + settings.buyerFeeFixedCents;
  const platformFeeCents = percentOfCents(subtotalCents, settings.platformCommissionPercent);
  const reserveCents = percentOfCents(subtotalCents, settings.reserveFundPercent);
  const promoterNetCents = subtotalCents - platformFeeCents - reserveCents;
  const totalCents = subtotalCents + buyerFeeCents;

  if (promoterNetCents < 0) {
    throw new Error("Split inválido: comissões excedem o subtotal");
  }

  return {
    subtotalCents,
    buyerFeeCents,
    platformFeeCents,
    reserveCents,
    promoterNetCents,
    totalCents,
  };
}

export function decimalToNumber(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

export function settingsToInput(row: {
  buyerFeePercent: { toNumber(): number } | number;
  buyerFeeFixedCents: number;
  platformCommissionPercent: { toNumber(): number } | number;
  reserveFundPercent: { toNumber(): number } | number;
  minWithdrawalCents: number;
  pendingReleaseDays: number;
  autoApproveWithdrawals: boolean;
  currency: string;
}): FinancialSettingsInput {
  return {
    buyerFeePercent: decimalToNumber(row.buyerFeePercent),
    buyerFeeFixedCents: row.buyerFeeFixedCents,
    platformCommissionPercent: decimalToNumber(row.platformCommissionPercent),
    reserveFundPercent: decimalToNumber(row.reserveFundPercent),
    minWithdrawalCents: row.minWithdrawalCents,
    pendingReleaseDays: row.pendingReleaseDays,
    autoApproveWithdrawals: row.autoApproveWithdrawals,
    currency: row.currency,
  };
}
