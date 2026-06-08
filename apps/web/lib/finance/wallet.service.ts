import { prisma } from "@/lib/prisma";
import type { Prisma, WalletType } from "@prisma/client";
import { computeWalletBalances } from "./balance-calculator";
import type { WalletBalances } from "./types";

const PLATFORM_CODE = "platform";
const RESERVE_CODE = "reserve";

export class WalletService {
  static orgCode(organizationId: string) {
    return `org:${organizationId}`;
  }

  static async ensureSystemWallets(tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    await client.wallet.upsert({
      where: { code: PLATFORM_CODE },
      create: { code: PLATFORM_CODE, type: "PLATFORM" },
      update: {},
    });
    await client.wallet.upsert({
      where: { code: RESERVE_CODE },
      create: { code: RESERVE_CODE, type: "RESERVE" },
      update: {},
    });
  }

  static async ensureOrganizationWallet(organizationId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    const code = WalletService.orgCode(organizationId);
    return client.wallet.upsert({
      where: { code },
      create: { code, type: "PROMOTER", organizationId },
      update: { deletedAt: null, isActive: true },
    });
  }

  static async getByCode(code: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    const wallet = await client.wallet.findFirst({
      where: { code, deletedAt: null, isActive: true },
    });
    if (!wallet) throw new Error(`Wallet não encontrada: ${code}`);
    return wallet;
  }

  static async getPlatformWallet(tx?: Prisma.TransactionClient) {
    return WalletService.getByCode(PLATFORM_CODE, tx);
  }

  static async getReserveWallet(tx?: Prisma.TransactionClient) {
    return WalletService.getByCode(RESERVE_CODE, tx);
  }

  /** Lock wallets for update (MySQL) */
  static async lockWallets(walletIds: string[], tx: Prisma.TransactionClient) {
    if (walletIds.length === 0) return;
    const placeholders = walletIds.map(() => "?").join(",");
    await tx.$executeRawUnsafe(
      `SELECT id FROM Wallet WHERE id IN (${placeholders}) FOR UPDATE`,
      ...walletIds
    );
  }

  static async getBalances(walletId: string, tx?: Prisma.TransactionClient): Promise<WalletBalances> {
    const client = tx ?? prisma;
    const wallet = await client.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new Error("Wallet não encontrada");

    const entries = await client.ledgerEntry.findMany({
      where: {
        walletId,
        transaction: { status: "COMPLETED", deletedAt: null },
      },
      select: { direction: true, balanceBucket: true, amountCents: true },
    });

    return computeWalletBalances(entries, wallet.currency);
  }

  static async getBalancesByType(type: WalletType, organizationId?: string) {
    const wallet = await prisma.wallet.findFirst({
      where: {
        type,
        organizationId: organizationId ?? null,
        deletedAt: null,
      },
    });
    if (!wallet) {
      return {
        pendingCents: 0,
        availableCents: 0,
        withdrawnCents: 0,
        currency: "EUR",
      };
    }
    return WalletService.getBalances(wallet.id);
  }
}
