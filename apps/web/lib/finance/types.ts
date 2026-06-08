import type { BalanceBucket, LedgerEntryDirection } from "@prisma/client";

export interface WalletBalances {
  pendingCents: number;
  availableCents: number;
  withdrawnCents: number;
  currency: string;
}

export interface PaymentSplit {
  subtotalCents: number;
  buyerFeeCents: number;
  platformFeeCents: number;
  reserveCents: number;
  promoterNetCents: number;
  totalCents: number;
}

export interface FinancialSettingsInput {
  buyerFeePercent: number;
  buyerFeeFixedCents: number;
  platformCommissionPercent: number;
  reserveFundPercent: number;
  minWithdrawalCents: number;
  pendingReleaseDays: number;
  autoApproveWithdrawals: boolean;
  currency: string;
}

export interface EnterpriseFinancialSettings extends FinancialSettingsInput {
  serviceFeeType: "PERCENTAGE" | "FIXED";
  serviceFeeValue: number;
  dynamicServiceFee: boolean;
  minimumProfitPerOrderCents: number;
  chargebackProtectionEnabled: boolean;
  automaticPayoutsEnabled: boolean;
  defaultVatPercent: number;
}

export interface LedgerEntryInput {
  walletId: string;
  direction: LedgerEntryDirection;
  balanceBucket: BalanceBucket;
  amountCents: number;
}

export interface CreateLedgerTransactionInput {
  type: import("@prisma/client").LedgerTransactionType;
  idempotencyKey?: string;
  description?: string;
  amountCents: number;
  currency?: string;
  referenceType?: string;
  referenceId?: string;
  orderId?: string;
  organizationId?: string;
  paymentProvider?: import("@prisma/client").PaymentProviderKind;
  metadata?: Record<string, unknown>;
  entries: LedgerEntryInput[];
}

export interface AdminFinanceDashboard {
  gmvCents: number;
  grossRevenueCents: number;
  netProfitCents: number;
  platformRevenueCents: number;
  gatewayFeesCents: number;
  reserveBalanceCents: number;
  refundsCents: number;
  chargebacksCents: number;
  withdrawalsPaidCents: number;
  withdrawalsPendingCents: number;
  ordersPaid: number;
  averageMarginPercent: number;
  currency: string;
}

export interface PromoterFinanceDashboard {
  grossCents: number;
  platformFeesCents: number;
  netCents: number;
  pendingCents: number;
  availableCents: number;
  withdrawnCents: number;
  currency: string;
  salesCount: number;
  withdrawableCents?: number;
  reservedWithdrawalCents?: number;
  ticketsSold?: number;
  nextPayoutEstimateCents?: number;
}

export type ReportPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface FinanceReportRow {
  periodStart: string;
  periodEnd: string;
  gmvCents: number;
  platformRevenueCents: number;
  gatewayFeesCents: number;
  netProfitCents: number;
  refundsCents: number;
  withdrawalsCents: number;
  ordersCount: number;
}

export type { EnterpriseSplitResult, EnterpriseSettings } from "./enterprise-calculator";
export { ProfitBelowMinimumError, calculateEnterpriseSplit, simulateFinancialScenario } from "./enterprise-calculator";
export type { PaymentMethodFees } from "./payment-method.service";
