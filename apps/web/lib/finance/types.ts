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
  platformRevenueCents: number;
  reserveBalanceCents: number;
  refundsCents: number;
  chargebacksCents: number;
  withdrawalsPaidCents: number;
  withdrawalsPendingCents: number;
  ordersPaid: number;
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
}

export type ReportPeriod = "daily" | "weekly" | "monthly";

export interface FinanceReportRow {
  periodStart: string;
  periodEnd: string;
  gmvCents: number;
  platformRevenueCents: number;
  refundsCents: number;
  withdrawalsCents: number;
  ordersCount: number;
}
