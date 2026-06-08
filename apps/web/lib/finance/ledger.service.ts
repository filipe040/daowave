import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { WalletService } from "./wallet.service";
import { FinancialAuditService } from "./audit.service";
import type { CreateLedgerTransactionInput } from "./types";

export class LedgerService {
  static validateEntries(entries: CreateLedgerTransactionInput["entries"]) {
    if (entries.length === 0) throw new Error("Ledger requer pelo menos uma entrada");
    for (const e of entries) {
      if (e.amountCents <= 0) throw new Error("Montante deve ser positivo");
    }
  }

  static async createTransaction(
    input: CreateLedgerTransactionInput,
    tx?: Prisma.TransactionClient
  ) {
    LedgerService.validateEntries(input.entries);

    const run = async (client: Prisma.TransactionClient) => {
      if (input.idempotencyKey) {
        const existing = await client.ledgerTransaction.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: { entries: true },
        });
        if (existing) return existing;
      }

      const walletIds = [...new Set(input.entries.map((e) => e.walletId))];
      await WalletService.lockWallets(walletIds, client);

      const transaction = await client.ledgerTransaction.create({
        data: {
          type: input.type,
          status: "COMPLETED",
          idempotencyKey: input.idempotencyKey,
          description: input.description,
          amountCents: input.amountCents,
          currency: input.currency ?? "EUR",
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          orderId: input.orderId,
          organizationId: input.organizationId,
          paymentProvider: input.paymentProvider,
          metadata: input.metadata as Prisma.InputJsonValue,
          completedAt: new Date(),
          entries: {
            create: input.entries.map((e) => ({
              walletId: e.walletId,
              direction: e.direction,
              balanceBucket: e.balanceBucket,
              amountCents: e.amountCents,
            })),
          },
        },
        include: { entries: true },
      });

      return transaction;
    };

    if (tx) return run(tx);
    return prisma.$transaction(run, { isolationLevel: "Serializable" });
  }

  static async reverseTransaction(
    originalId: string,
    params: {
      idempotencyKey: string;
      type: CreateLedgerTransactionInput["type"];
      description?: string;
      actorUserId?: string;
    },
    tx?: Prisma.TransactionClient
  ) {
    const run = async (client: Prisma.TransactionClient) => {
      const original = await client.ledgerTransaction.findUnique({
        where: { id: originalId },
        include: { entries: true },
      });
      if (!original) throw new Error("Transação original não encontrada");
      if (original.status === "REVERSED") {
        const reversal = await client.ledgerTransaction.findFirst({
          where: { reversedById: originalId },
        });
        if (reversal) return reversal;
      }
      if (original.status !== "COMPLETED") {
        throw new Error("Só transações concluídas podem ser revertidas");
      }

      const reversedEntries = original.entries.map((e) => ({
        walletId: e.walletId,
        direction: e.direction === "CREDIT" ? ("DEBIT" as const) : ("CREDIT" as const),
        balanceBucket: e.balanceBucket,
        amountCents: e.amountCents,
      }));

      const reversal = await LedgerService.createTransaction(
        {
          type: params.type,
          idempotencyKey: params.idempotencyKey,
          description: params.description ?? `Reversão de ${originalId}`,
          amountCents: original.amountCents,
          currency: original.currency,
          orderId: original.orderId ?? undefined,
          organizationId: original.organizationId ?? undefined,
          referenceType: "LEDGER_TRANSACTION",
          referenceId: originalId,
          entries: reversedEntries,
        },
        client
      );

      await client.ledgerTransaction.update({
        where: { id: originalId },
        data: { status: "REVERSED", reversedAt: new Date(), reversedById: reversal.id },
      });

      await FinancialAuditService.log(
        {
          actorUserId: params.actorUserId,
          action: "LEDGER_REVERSED",
          entityType: "LedgerTransaction",
          entityId: originalId,
          transactionId: reversal.id,
          afterJson: { reversalId: reversal.id },
        },
        client
      );

      return reversal;
    };

    if (tx) return run(tx);
    return prisma.$transaction(run, { isolationLevel: "Serializable" });
  }

  static async listTransactions(filters: {
    organizationId?: string;
    orderId?: string;
    type?: import("@prisma/client").LedgerTransactionType;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const where: Prisma.LedgerTransactionWhereInput = {
      deletedAt: null,
      ...(filters.organizationId && { organizationId: filters.organizationId }),
      ...(filters.orderId && { orderId: filters.orderId }),
      ...(filters.type && { type: filters.type }),
    };

    const [items, total] = await Promise.all([
      prisma.ledgerTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          entries: { include: { wallet: { select: { code: true, type: true } } } },
          order: { select: { id: true, buyerEmail: true, event: { select: { title: true } } } },
        },
      }),
      prisma.ledgerTransaction.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }
}
