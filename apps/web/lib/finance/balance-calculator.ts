import type { BalanceBucket, LedgerEntryDirection } from "@prisma/client";
import type { WalletBalances } from "./types";

type EntryRow = {
  direction: LedgerEntryDirection;
  balanceBucket: BalanceBucket;
  amountCents: number;
};

/** Saldos derivados exclusivamente dos movimentos do ledger */
export function computeWalletBalances(
  entries: EntryRow[],
  currency = "EUR"
): WalletBalances {
  const buckets: Record<BalanceBucket, number> = {
    PENDING: 0,
    AVAILABLE: 0,
    WITHDRAWN: 0,
  };

  for (const entry of entries) {
    const sign = entry.direction === "CREDIT" ? 1 : -1;
    buckets[entry.balanceBucket] += sign * entry.amountCents;
  }

  return {
    pendingCents: buckets.PENDING,
    availableCents: buckets.AVAILABLE,
    withdrawnCents: buckets.WITHDRAWN,
    currency,
  };
}

export function sumCreditsByBucket(
  entries: EntryRow[],
  bucket: BalanceBucket
): number {
  return entries
    .filter((e) => e.balanceBucket === bucket && e.direction === "CREDIT")
    .reduce((s, e) => s + e.amountCents, 0);
}
