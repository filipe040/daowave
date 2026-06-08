import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { LedgerService } from "./ledger.service";
import { FinancialAuditService } from "./audit.service";
import { WalletService } from "./wallet.service";

export class RefundService {
  static async createRefund(params: {
    orderId: string;
    reason?: string;
    initiatedByUserId?: string;
    idempotencyKey?: string;
    fullRefund?: boolean;
  }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: params.orderId },
        include: {
          financialBreakdown: true,
          event: { select: { organizationId: true } },
        },
      });

      if (!order) throw new Error("Encomenda não encontrada");
      if (!order.financialBreakdown) {
        throw new Error("Encomenda sem registo financeiro — processar pagamento primeiro");
      }
      if (order.status === "REFUNDED") throw new Error("Encomenda já reembolsada");

      const amountCents = params.fullRefund !== false
        ? order.financialBreakdown.totalCents
        : order.financialBreakdown.totalCents;

      const refund = await tx.refund.create({
        data: {
          orderId: order.id,
          amountCents,
          currency: order.currency,
          reason: params.reason,
          status: "PROCESSING",
          initiatedByUserId: params.initiatedByUserId,
        },
      });

      const originalTx = await tx.ledgerTransaction.findUnique({
        where: { id: order.financialBreakdown.ledgerTransactionId },
        include: { entries: true },
      });

      if (!originalTx) throw new Error("Transação original não encontrada");

      const reversal = await LedgerService.reverseTransaction(
        originalTx.id,
        {
          idempotencyKey: params.idempotencyKey ?? `refund:${refund.id}`,
          type: "REFUND",
          description: `Reembolso encomenda ${order.id}`,
          actorUserId: params.initiatedByUserId,
        },
        tx
      );

      await tx.refund.update({
        where: { id: refund.id },
        data: {
          status: "COMPLETED",
          ledgerTransactionId: reversal.id,
          processedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: "REFUNDED" },
      });

      await tx.ticket.updateMany({
        where: { orderId: order.id, status: "VALID" },
        data: { status: "REFUNDED" },
      });

      await FinancialAuditService.log(
        {
          actorUserId: params.initiatedByUserId,
          action: "REFUND_COMPLETED",
          entityType: "Refund",
          entityId: refund.id,
          transactionId: reversal.id,
          afterJson: { orderId: order.id, amountCents },
        },
        tx
      );

      return { refund, reversal };
    }, { isolationLevel: "Serializable" });
  }

  static async list(filters: { page?: number; limit?: number; status?: string }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const where: Prisma.RefundWhereInput = {
      deletedAt: null,
      ...(filters.status && { status: filters.status as Prisma.EnumRefundStatusFilter["equals"] }),
    };

    const [items, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              buyerEmail: true,
              event: { select: { title: true, organizationId: true } },
            },
          },
        },
      }),
      prisma.refund.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }
}
