import { prisma } from "@/lib/prisma";
import type { BalanceBucket, Prisma, WalletTransactionType } from "@prisma/client";
import { WalletService } from "./wallet.service";
import { computeWalletBalances } from "./balance-calculator";

export class WalletTransactionService {
  /** Regista snapshot auditável após movimento no ledger */
  static async recordSnapshots(
    params: {
      walletId: string;
      ledgerTransactionId: string;
      type: WalletTransactionType;
      amountCents: number;
      balanceBucket: BalanceBucket;
      direction: "CREDIT" | "DEBIT";
      referenceType?: string;
      referenceId?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    },
    tx: Prisma.TransactionClient
  ) {
    const entries = await tx.ledgerEntry.findMany({
      where: {
        walletId: params.walletId,
        transaction: { status: "COMPLETED", deletedAt: null },
      },
      select: { direction: true, balanceBucket: true, amountCents: true },
    });

    const balances = computeWalletBalances(entries);
    const bucketKey =
      params.balanceBucket === "PENDING"
        ? "pendingCents"
        : params.balanceBucket === "AVAILABLE"
          ? "availableCents"
          : "withdrawnCents";

    const balanceBefore = balances[bucketKey];
    const delta = params.direction === "CREDIT" ? params.amountCents : -params.amountCents;
    const balanceAfter = balanceBefore + delta;

    return tx.walletTransaction.create({
      data: {
        walletId: params.walletId,
        ledgerTransactionId: params.ledgerTransactionId,
        type: params.type,
        amountCents: params.amountCents,
        balanceBucket: params.balanceBucket,
        balanceBeforeCents: balanceBefore,
        balanceAfterCents: balanceAfter,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        description: params.description,
        metadata: params.metadata as Prisma.InputJsonValue,
      },
    });
  }

  static async listForWallet(walletId: string, limit = 50) {
    return prisma.walletTransaction.findMany({
      where: { walletId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
