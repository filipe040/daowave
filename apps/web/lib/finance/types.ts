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
  pricingMode: "FORMULA" | "TIERED";
  serviceFeeFixedCents: number;
  minimumServiceFeeCents: number;
  maximumServiceFeeCents: number | null;
  operationalReserveCents: number;
  roundingMode: "NONE" | "END_49" | "END_99" | "END_49_99";
  absorbPaymentFees: boolean;
  defaultFeePaidBy: "BUYER" | "ORGANIZER";
}

export interface PromoterFinancialProfile {
  organizationId: string;
  pricingMode: "GLOBAL" | "CUSTOM";
  customFixedFeeCents: number | null;
  customPercentageFee: number | null;
  customMinimumFeeCents: number | null;
  customMaximumFeeCents: number | null;
  customOperationalReserveCents: number | null;
  feePaidBy: "BUYER" | "ORGANIZER" | null;
  settlementFrequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "MANUAL";
  lastSettlementAt: string | null;
  active: boolean;
  serviceFeeMode: "PERCENTAGE" | "FIXED" | null;
  serviceFeeValue: number | null;
  reservePercentage: number | null;
  minimumProfitPerOrderCents: number | null;
  payoutDelayDays: number | null;
}

export interface CommissionTierInput {
  id?: string;
  minPriceCents: number;
  maxPriceCents: number | null;
  fixedFeeCents: number;
  percentageFee: number;
  active: boolean;
  sortOrder: number;
}

export interface FeeCampaignInput {
  id?: string;
  name: string;
  startDate: string;
  endDate: string;
  discountType: "PERCENT_OFF_FEE" | "FIXED_FEE_OVERRIDE" | "ZERO_FEE";
  discountValue: number;
  organizationId: string | null;
  firstEventOnly: boolean;
  active: boolean;
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
  activeEvents: number;
  ticketsSold: number;
  activeOrganizers: number;
  walletBalanceCents: number;
  pendingSettlementCents: number;
  operationalProfitCents: number;
}

export interface FinanceChartPoint {
  date: string;
  gmvCents: number;
  revenueCents: number;
  profitCents: number;
  ordersCount: number;
}

export interface FeePreviewResult {
  ticketPriceCents: number;
  serviceFeeCents: number;
  totalCustomerCents: number;
  promoterReceivesCents: number;
  feePaidBy: "BUYER" | "ORGANIZER";
  breakdown: Record<string, string>;
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
