import { prisma } from "@/lib/prisma";
import type { Prisma, WithdrawalStatus } from "@prisma/client";
import type { BalanceBucket } from "@prisma/client";
import { FinancialSettingsService } from "./settings.service";
import { WalletService } from "./wallet.service";
import { LedgerService } from "./ledger.service";
import { FinancialAuditService } from "./audit.service";
import { FinanceBackfillService } from "./backfill.service";
import { BalanceReleaseJob } from "./report.service";

const ACTIVE_WITHDRAWAL_STATUSES: WithdrawalStatus[] = ["PENDING", "APPROVED", "PROCESSING"];

export class WithdrawalService {
  /** Montante já reservado em pedidos de levantamento activos */
  static async getReservedCents(organizationId: string) {
    const agg = await prisma.withdrawalRequest.aggregate({
      where: {
        organizationId,
        status: { in: ACTIVE_WITHDRAWAL_STATUSES },
        deletedAt: null,
      },
      _sum: { amountCents: true },
    });
    return agg._sum.amountCents ?? 0;
  }

  /** Saldo que o promotor pode pedir para levantar (pendente + disponível − reservas) */
  static async getWithdrawableCents(organizationId: string) {
    await WalletService.ensureOrganizationWallet(organizationId);
    const wallet = await WalletService.getByCode(WalletService.orgCode(organizationId));
    const balances = await WalletService.getBalances(wallet.id);
    const reserved = await WithdrawalService.getReservedCents(organizationId);
    return Math.max(0, balances.pendingCents + balances.availableCents - reserved);
  }

  /** Sincroniza ledger (backfill + libertação de saldos elegíveis) */
  static async syncOrganizationFinance(organizationId: string) {
    await WalletService.ensureSystemWallets();
    await WalletService.ensureOrganizationWallet(organizationId);
    const backfill = await FinanceBackfillService.backfillOrganization(organizationId);
    const release = await BalanceReleaseJob.releaseForOrganization(organizationId);
    return { backfill, release };
  }

  static async requestWithdrawal(params: {
    organizationId: string;
    amountCents: number;
    bankDetails?: Record<string, unknown>;
    requestedByUserId?: string;
  }) {
    await WithdrawalService.syncOrganizationFinance(params.organizationId);

    const settings = await FinancialSettingsService.get();

    if (params.amountCents < settings.minWithdrawalCents) {
      throw new Error(
        `Montante mínimo de levantamento: ${(settings.minWithdrawalCents / 100).toFixed(2)}€`
      );
    }

    const wallet = await WalletService.ensureOrganizationWallet(params.organizationId);
    const withdrawable = await WithdrawalService.getWithdrawableCents(params.organizationId);

    if (withdrawable < params.amountCents) {
      const balances = await WalletService.getBalances(wallet.id);
      if (balances.pendingCents + balances.availableCents === 0) {
        throw new Error(
          "Ainda não tens saldo para levantar. O saldo é creditado após vendas confirmadas."
        );
      }
      throw new Error(
        `Saldo levantável insuficiente. Disponível para pedido: ${(withdrawable / 100).toFixed(2)}€`
      );
    }

    const autoApproved = settings.autoApproveWithdrawals;

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        walletId: wallet.id,
        organizationId: params.organizationId,
        amountCents: params.amountCents,
        currency: settings.currency,
        status: autoApproved ? "APPROVED" : "PENDING",
        bankDetails: params.bankDetails as Prisma.InputJsonValue,
        autoApproved,
        approvedByUserId: autoApproved ? params.requestedByUserId : null,
      },
    });

    await FinancialAuditService.log({
      actorUserId: params.requestedByUserId,
      action: "WITHDRAWAL_REQUESTED",
      entityType: "WithdrawalRequest",
      entityId: withdrawal.id,
      afterJson: { amountCents: params.amountCents, autoApproved },
    });

    if (autoApproved) {
      await WithdrawalService.markProcessing(withdrawal.id, params.requestedByUserId);
    }

    return withdrawal;
  }

  static async updateStatus(
    withdrawalId: string,
    status: WithdrawalStatus,
    params: { actorUserId?: string; rejectedReason?: string }
  ) {
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId, deletedAt: null },
    });
    if (!withdrawal) throw new Error("Pedido de levantamento não encontrado");

    if (status === "APPROVED" && withdrawal.status === "PENDING") {
      await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "APPROVED",
          approvedByUserId: params.actorUserId,
        },
      });
      await WithdrawalService.markProcessing(withdrawalId, params.actorUserId);
      return;
    }

    if (status === "REJECTED" && withdrawal.status === "PENDING") {
      await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          rejectedReason: params.rejectedReason,
        },
      });
      await FinancialAuditService.log({
        actorUserId: params.actorUserId,
        action: "WITHDRAWAL_REJECTED",
        entityType: "WithdrawalRequest",
        entityId: withdrawalId,
        afterJson: { reason: params.rejectedReason },
      });
      return;
    }

    if (status === "PAID" && (withdrawal.status === "PROCESSING" || withdrawal.status === "APPROVED")) {
      await WithdrawalService.markPaid(withdrawalId, params.actorUserId);
      return;
    }

    throw new Error(`Transição de estado inválida: ${withdrawal.status} → ${status}`);
  }

  private static async markProcessing(withdrawalId: string, actorUserId?: string) {
    await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: { status: "PROCESSING" },
    });

    await FinancialAuditService.log({
      actorUserId,
      action: "WITHDRAWAL_PROCESSING",
      entityType: "WithdrawalRequest",
      entityId: withdrawalId,
    });
  }

  private static async markPaid(withdrawalId: string, actorUserId?: string) {
    return prisma.$transaction(async (tx) => {
      const withdrawal = await tx.withdrawalRequest.findUniqueOrThrow({
        where: { id: withdrawalId },
      });

      if (withdrawal.ledgerTransactionId) {
        return withdrawal;
      }

      await WalletService.lockWallets([withdrawal.walletId], tx);
      const balances = await WalletService.getBalances(withdrawal.walletId, tx);

      let remaining = withdrawal.amountCents;
      const debitEntries: Array<{
        walletId: string;
        direction: "DEBIT";
        balanceBucket: BalanceBucket;
        amountCents: number;
      }> = [];

      const fromAvailable = Math.min(balances.availableCents, remaining);
      if (fromAvailable > 0) {
        debitEntries.push({
          walletId: withdrawal.walletId,
          direction: "DEBIT",
          balanceBucket: "AVAILABLE",
          amountCents: fromAvailable,
        });
        remaining -= fromAvailable;
      }

      if (remaining > 0) {
        if (balances.pendingCents < remaining) {
          throw new Error("Saldo insuficiente na wallet para concluir o levantamento");
        }
        debitEntries.push({
          walletId: withdrawal.walletId,
          direction: "DEBIT",
          balanceBucket: "PENDING",
          amountCents: remaining,
        });
        remaining = 0;
      }

      const transaction = await LedgerService.createTransaction(
        {
          type: "WITHDRAWAL",
          idempotencyKey: `withdrawal:${withdrawalId}`,
          description: `Levantamento ${withdrawalId}`,
          amountCents: withdrawal.amountCents,
          currency: withdrawal.currency,
          organizationId: withdrawal.organizationId,
          referenceType: "WITHDRAWAL",
          referenceId: withdrawalId,
          entries: [
            ...debitEntries,
            {
              walletId: withdrawal.walletId,
              direction: "CREDIT",
              balanceBucket: "WITHDRAWN",
              amountCents: withdrawal.amountCents,
            },
          ],
        },
        tx
      );

      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "PAID",
          ledgerTransactionId: transaction!.id,
          paidAt: new Date(),
        },
      });

      await FinancialAuditService.log(
        {
          actorUserId,
          action: "WITHDRAWAL_PAID",
          entityType: "WithdrawalRequest",
          entityId: withdrawalId,
          transactionId: transaction!.id,
        },
        tx
      );

      return tx.withdrawalRequest.findUniqueOrThrow({ where: { id: withdrawalId } });
    }, { isolationLevel: "Serializable" });
  }

  static async list(filters: {
    organizationId?: string;
    status?: WithdrawalStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const where: Prisma.WithdrawalRequestWhereInput = {
      deletedAt: null,
      ...(filters.organizationId && { organizationId: filters.organizationId }),
      ...(filters.status && { status: filters.status }),
    };

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);

    return { items, total, page, pages: Math.ceil(total / limit) };
  }
}
