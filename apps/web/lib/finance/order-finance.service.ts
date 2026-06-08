import { prisma } from "@/lib/prisma";
import type { PaymentProviderKind, Prisma } from "@prisma/client";
import { calculatePaymentSplit } from "./fee-calculator";
import { FinancialSettingsService } from "./settings.service";
import { WalletService } from "./wallet.service";
import { LedgerService } from "./ledger.service";
import { FinancialAuditService } from "./audit.service";

export class OrderFinanceService {
  static async processOrderPayment(
    orderId: string,
    options?: {
      paymentProvider?: PaymentProviderKind;
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

      const settings = await FinancialSettingsService.get(tx);
      const split = calculatePaymentSplit(subtotalCents, settings);

      await WalletService.ensureSystemWallets(tx);
      const [platformWallet, reserveWallet, promoterWallet] = await Promise.all([
        WalletService.getPlatformWallet(tx),
        WalletService.getReserveWallet(tx),
        WalletService.ensureOrganizationWallet(order.event.organizationId, tx),
      ]);

      const platformCredit = split.platformFeeCents + split.buyerFeeCents;
      const idempotencyKey = options?.idempotencyKey ?? `order-payment:${orderId}`;

      const transaction = await LedgerService.createTransaction(
        {
          type: "ORDER_PAYMENT",
          idempotencyKey,
          description: `Pagamento encomenda ${orderId}`,
          amountCents: split.totalCents,
          currency: order.currency,
          orderId: order.id,
          organizationId: order.event.organizationId,
          paymentProvider: options?.paymentProvider,
          referenceType: "ORDER",
          referenceId: orderId,
          metadata: {
            subtotalCents: split.subtotalCents,
            buyerFeeCents: split.buyerFeeCents,
            platformFeeCents: split.platformFeeCents,
            reserveCents: split.reserveCents,
            promoterNetCents: split.promoterNetCents,
            eventTitle: order.event.title,
          },
          entries: [
            ...(platformCredit > 0
              ? [
                  {
                    walletId: platformWallet.id,
                    direction: "CREDIT" as const,
                    balanceBucket: "PENDING" as const,
                    amountCents: platformCredit,
                  },
                ]
              : []),
            ...(split.reserveCents > 0
              ? [
                  {
                    walletId: reserveWallet.id,
                    direction: "CREDIT" as const,
                    balanceBucket: "PENDING" as const,
                    amountCents: split.reserveCents,
                  },
                ]
              : []),
            ...(split.promoterNetCents > 0
              ? [
                  {
                    walletId: promoterWallet.id,
                    direction: "CREDIT" as const,
                    balanceBucket: "PENDING" as const,
                    amountCents: split.promoterNetCents,
                  },
                ]
              : []),
          ],
        },
        tx
      );

      await tx.orderFinancialBreakdown.create({
        data: {
          orderId: order.id,
          ledgerTransactionId: transaction!.id,
          subtotalCents: split.subtotalCents,
          buyerFeeCents: split.buyerFeeCents,
          platformFeeCents: split.platformFeeCents,
          reserveCents: split.reserveCents,
          promoterNetCents: split.promoterNetCents,
          totalCents: split.totalCents,
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
