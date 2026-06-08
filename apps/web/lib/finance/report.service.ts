import { prisma } from "@/lib/prisma";
import { WalletService } from "./wallet.service";
import { LedgerService } from "./ledger.service";
import { FinancialSettingsService } from "./settings.service";
import type { AdminFinanceDashboard, FinanceReportRow, PromoterFinanceDashboard, ReportPeriod } from "./types";

function periodBounds(period: ReportPeriod, ref = new Date()) {
  const end = new Date(ref);
  end.setHours(23, 59, 59, 999);
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);

  if (period === "weekly") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
  } else if (period === "monthly") {
    start.setDate(1);
  }

  return { start, end };
}

export class FinanceReportService {
  static async getAdminDashboard(): Promise<AdminFinanceDashboard> {
    const settings = await FinancialSettingsService.get();

    const [
      ordersAgg,
      breakdownAgg,
      refundsAgg,
      chargebacksAgg,
      withdrawalsPaid,
      withdrawalsPending,
      platformBalances,
      reserveBalances,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalCents: true },
        _count: true,
      }),
      prisma.orderFinancialBreakdown.aggregate({
        _sum: { platformFeeCents: true, buyerFeeCents: true },
      }),
      prisma.refund.aggregate({
        where: { status: "COMPLETED", deletedAt: null },
        _sum: { amountCents: true },
      }),
      prisma.chargeback.aggregate({
        where: { status: { in: ["OPEN", "LOST"] }, deletedAt: null },
        _sum: { amountCents: true },
      }),
      prisma.withdrawalRequest.aggregate({
        where: { status: "PAID", deletedAt: null },
        _sum: { amountCents: true },
      }),
      prisma.withdrawalRequest.aggregate({
        where: { status: { in: ["PENDING", "APPROVED", "PROCESSING"] }, deletedAt: null },
        _sum: { amountCents: true },
      }),
      WalletService.getBalancesByType("PLATFORM"),
      WalletService.getBalancesByType("RESERVE"),
    ]);

    const platformRevenue =
      (breakdownAgg._sum.platformFeeCents ?? 0) + (breakdownAgg._sum.buyerFeeCents ?? 0);

    return {
      gmvCents: ordersAgg._sum.totalCents ?? 0,
      platformRevenueCents: platformRevenue,
      reserveBalanceCents:
        reserveBalances.pendingCents + reserveBalances.availableCents,
      refundsCents: refundsAgg._sum.amountCents ?? 0,
      chargebacksCents: chargebacksAgg._sum.amountCents ?? 0,
      withdrawalsPaidCents: withdrawalsPaid._sum.amountCents ?? 0,
      withdrawalsPendingCents: withdrawalsPending._sum.amountCents ?? 0,
      ordersPaid: ordersAgg._count,
      currency: settings.currency,
    };
  }

  static async getPromoterDashboard(organizationId: string): Promise<PromoterFinanceDashboard> {
    const settings = await FinancialSettingsService.get();
    const wallet = await prisma.wallet.findFirst({
      where: { organizationId, type: "PROMOTER", deletedAt: null },
    });

    const balances = wallet
      ? await WalletService.getBalances(wallet.id)
      : { pendingCents: 0, availableCents: 0, withdrawnCents: 0, currency: settings.currency };

    const [breakdownAgg, salesCount] = await Promise.all([
      prisma.orderFinancialBreakdown.aggregate({
        where: { order: { event: { organizationId }, status: "PAID" } },
        _sum: {
          subtotalCents: true,
          platformFeeCents: true,
          promoterNetCents: true,
        },
      }),
      prisma.order.count({
        where: { status: "PAID", event: { organizationId } },
      }),
    ]);

    const gross = breakdownAgg._sum.subtotalCents ?? 0;
    const fees = breakdownAgg._sum.platformFeeCents ?? 0;
    const net = breakdownAgg._sum.promoterNetCents ?? 0;

    return {
      grossCents: gross,
      platformFeesCents: fees,
      netCents: net,
      pendingCents: balances.pendingCents,
      availableCents: balances.availableCents,
      withdrawnCents: balances.withdrawnCents,
      currency: settings.currency,
      salesCount,
    };
  }

  static async generateReport(period: ReportPeriod, ref = new Date()): Promise<FinanceReportRow> {
    const { start, end } = periodBounds(period, ref);

    const [orders, refunds, withdrawals] = await Promise.all([
      prisma.orderFinancialBreakdown.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          order: { status: "PAID" },
        },
        select: {
          totalCents: true,
          platformFeeCents: true,
          buyerFeeCents: true,
        },
      }),
      prisma.refund.aggregate({
        where: {
          status: "COMPLETED",
          createdAt: { gte: start, lte: end },
          deletedAt: null,
        },
        _sum: { amountCents: true },
      }),
      prisma.withdrawalRequest.aggregate({
        where: {
          status: "PAID",
          paidAt: { gte: start, lte: end },
          deletedAt: null,
        },
        _sum: { amountCents: true },
      }),
    ]);

    const gmvCents = orders.reduce((s, o) => s + o.totalCents, 0);
    const platformRevenueCents = orders.reduce(
      (s, o) => s + o.platformFeeCents + o.buyerFeeCents,
      0
    );

    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      gmvCents,
      platformRevenueCents,
      refundsCents: refunds._sum.amountCents ?? 0,
      withdrawalsCents: withdrawals._sum.amountCents ?? 0,
      ordersCount: orders.length,
    };
  }

  static reportToCsv(rows: FinanceReportRow[]): string {
    const header = "periodStart,periodEnd,gmvCents,platformRevenueCents,refundsCents,withdrawalsCents,ordersCount";
    const lines = rows.map(
      (r) =>
        `${r.periodStart},${r.periodEnd},${r.gmvCents},${r.platformRevenueCents},${r.refundsCents},${r.withdrawalsCents},${r.ordersCount}`
    );
    return [header, ...lines].join("\n");
  }
}

export class BalanceReleaseJob {
  static async run() {
    const settings = await FinancialSettingsService.get();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - settings.pendingReleaseDays);

    const pendingPayments = await prisma.ledgerTransaction.findMany({
      where: {
        type: "ORDER_PAYMENT",
        status: "COMPLETED",
        balanceReleasedAt: null,
        completedAt: { lte: cutoff },
        deletedAt: null,
      },
      include: { entries: true },
    });

    let released = 0;

    for (const payment of pendingPayments) {
      await prisma.$transaction(async (tx) => {
        const entries = payment.entries.filter((e) => e.balanceBucket === "PENDING" && e.direction === "CREDIT");
        if (entries.length === 0) return;

        await LedgerService.createTransaction(
          {
            type: "BALANCE_RELEASE",
            idempotencyKey: `balance-release:${payment.id}`,
            description: `Libertação de saldo pendente — ${payment.id}`,
            amountCents: payment.amountCents,
            referenceType: "LEDGER_TRANSACTION",
            referenceId: payment.id,
            entries: entries.flatMap((e) => [
              {
                walletId: e.walletId,
                direction: "DEBIT" as const,
                balanceBucket: "PENDING" as const,
                amountCents: e.amountCents,
              },
              {
                walletId: e.walletId,
                direction: "CREDIT" as const,
                balanceBucket: "AVAILABLE" as const,
                amountCents: e.amountCents,
              },
            ]),
          },
          tx
        );

        await tx.ledgerTransaction.update({
          where: { id: payment.id },
          data: { balanceReleasedAt: new Date() },
        });
      }, { isolationLevel: "Serializable" });

      released++;
    }

    return { released, scanned: pendingPayments.length };
  }
}
