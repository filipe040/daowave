import { prisma } from "@/lib/prisma";
import type { FeePaidBy, PaymentProviderKind, Prisma } from "@prisma/client";
import { FinancialEngine } from "./financial-engine";
import { PaymentMethodService } from "./payment-method.service";
import { WalletService } from "./wallet.service";
import { LedgerService } from "./ledger.service";
import { FinancialAuditService } from "./audit.service";
import { WalletTransactionService } from "./wallet-transaction.service";
import type { WalletTransactionType } from "@prisma/client";

export class OrderFinanceService {
  static async processOrderPayment(
    orderId: string,
    options?: {
      paymentProvider?: PaymentProviderKind;
      paymentMethodCode?: string;
      actorUserId?: string;
      idempotencyKey?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.orderFinancialBreakdown.findUnique({ where: { orderId } });
      if (existing) {
        return tx.ledgerTransaction.findUnique({
          where: { id: existing.ledgerTransactionId },
          include: { entries: true },
        });
      }

      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          event: { select: { organizationId: true, title: true } },
        },
      });

      if (!order) throw new Error("Encomenda não encontrada");
      if (order.status !== "PAID") throw new Error("Encomenda não está paga");
      if (!order.event.organizationId) throw new Error("Evento sem organização");

      const subtotalCents = order.items.reduce(
        (sum, item) => sum + item.unitPriceCents * item.quantity,
        0
      );

      const methodCode = options?.paymentMethodCode ?? "MBWAY";
      let paymentMethod;
      try {
        paymentMethod = await PaymentMethodService.getByCode(methodCode, tx);
      } catch {
        paymentMethod = await PaymentMethodService.getByCode("MBWAY", tx);
      }

      const feePaidBy: FeePaidBy = order.feePaidBy ?? "BUYER";
      const serviceFeeCents = order.serviceFeeCents;

      const split = await FinancialEngine.calculateOrderSplit({
        ticketPriceCents: subtotalCents,
        organizationId: order.event.organizationId,
        paymentMethod,
        paymentMethodCode: methodCode,
        snapshot: {
          serviceFeeCents,
          feePaidBy,
        },
      });

      await WalletService.ensureSystemWallets(tx);
      const [platformWallet, reserveWallet, promoterWallet] = await Promise.all([
        WalletService.getPlatformWallet(tx),
        WalletService.getReserveWallet(tx),
        WalletService.ensureOrganizationWallet(order.event.organizationId, tx),
      ]);

      const idempotencyKey = options?.idempotencyKey ?? `order-payment:${orderId}`;

      const ledgerEntries = [
        {
          walletId: platformWallet.id,
          direction: "CREDIT" as const,
          balanceBucket: "PENDING" as const,
          amountCents: split.netPlatformProfitCents,
          snapshotType: "SERVICE_FEE" as WalletTransactionType,
        },
        {
          walletId: reserveWallet.id,
          direction: "CREDIT" as const,
          balanceBucket: "PENDING" as const,
          amountCents: split.reserveCents,
          snapshotType: "RESERVE_HOLD" as WalletTransactionType,
        },
        {
          walletId: promoterWallet.id,
          direction: "CREDIT" as const,
          balanceBucket: "PENDING" as const,
          amountCents: split.promoterNetCents,
          snapshotType: "TICKET_SALE" as WalletTransactionType,
        },
      ].filter((e) => e.amountCents > 0);

      const transaction = await LedgerService.createTransaction(
        {
          type: "ORDER_PAYMENT",
          idempotencyKey,
          description: `Pagamento encomenda ${orderId}`,
          amountCents: split.totalCustomerCents,
          currency: order.currency,
          orderId: order.id,
          organizationId: order.event.organizationId,
          paymentProvider: options?.paymentProvider,
          referenceType: "ORDER",
          referenceId: orderId,
          metadata: {
            ...split,
            gatewayFeeCents: split.gatewayFeeCents,
            eventTitle: order.event.title,
          },
          entries: ledgerEntries.map(({ snapshotType: _, ...e }) => e),
        },
        tx
      );

      for (const entry of ledgerEntries) {
        await WalletTransactionService.recordSnapshots(
          {
            walletId: entry.walletId,
            ledgerTransactionId: transaction!.id,
            type: entry.snapshotType,
            amountCents: entry.amountCents,
            balanceBucket: entry.balanceBucket,
            direction: entry.direction,
            referenceType: "ORDER",
            referenceId: orderId,
            description: `Pagamento ${orderId}`,
            metadata: { gatewayFeeCents: split.gatewayFeeCents },
          },
          tx
        );
      }

      await tx.orderFinancialBreakdown.create({
        data: {
          orderId: order.id,
          ledgerTransactionId: transaction!.id,
          subtotalCents,
          buyerFeeCents: split.serviceFeeCents,
          serviceFeeCents: split.serviceFeeCents,
          platformFeeCents: split.netPlatformProfitCents,
          gatewayFeeCents: split.gatewayFeeCents,
          netPlatformProfitCents: split.netPlatformProfitCents,
          vatCents: split.vatCents,
          reserveCents: split.reserveCents,
          promoterNetCents: split.promoterNetCents,
          totalCents: split.totalCustomerCents,
          paymentMethodCode: split.paymentMethodCode,
          marginPercent: split.marginPercent,
          feePaidBy: split.feePaidBy,
          operationalReserveCents: split.operationalReserveCents,
          appliedCampaignId: split.appliedCampaignId,
          appliedTierId: split.appliedTierId,
          pricingModeUsed: split.pricingModeUsed,
          currency: order.currency,
        },
      });

      await FinancialAuditService.log(
        {
          actorUserId: options?.actorUserId,
          action: "ORDER_PAYMENT_RECORDED",
          entityType: "Order",
          entityId: orderId,
          transactionId: transaction!.id,
          afterJson: split as unknown as Prisma.InputJsonValue,
        },
        tx
      );

      return transaction;
    }, { isolationLevel: "Serializable" });
  }
}
