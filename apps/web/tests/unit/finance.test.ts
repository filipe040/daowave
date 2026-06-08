import { calculatePaymentSplit, percentOfCents } from "@/lib/finance/fee-calculator";
import { computeWalletBalances } from "@/lib/finance/balance-calculator";
import { LedgerService } from "@/lib/finance/ledger.service";

describe("calculatePaymentSplit", () => {
  const settings = {
    buyerFeePercent: 2,
    buyerFeeFixedCents: 50,
    platformCommissionPercent: 5,
    reserveFundPercent: 2,
  };

  it("distribui subtotal, taxas e total corretamente", () => {
    const split = calculatePaymentSplit(10000, settings);
    expect(split.subtotalCents).toBe(10000);
    expect(split.buyerFeeCents).toBe(250); // 2% + 50c
    expect(split.platformFeeCents).toBe(500);
    expect(split.reserveCents).toBe(200);
    expect(split.promoterNetCents).toBe(9300);
    expect(split.totalCents).toBe(10250);
  });

  it("percentOfCents arredonda corretamente", () => {
    expect(percentOfCents(999, 2.5)).toBe(25);
  });

  it("rejeita split inválido quando comissões excedem subtotal", () => {
    expect(() =>
      calculatePaymentSplit(100, {
        ...settings,
        platformCommissionPercent: 60,
        reserveFundPercent: 50,
      })
    ).toThrow("Split inválido");
  });
});

describe("computeWalletBalances", () => {
  it("calcula saldos a partir de movimentos CREDIT/DEBIT", () => {
    const balances = computeWalletBalances([
      { direction: "CREDIT", balanceBucket: "PENDING", amountCents: 1000 },
      { direction: "CREDIT", balanceBucket: "AVAILABLE", amountCents: 500 },
      { direction: "DEBIT", balanceBucket: "AVAILABLE", amountCents: 200 },
      { direction: "CREDIT", balanceBucket: "WITHDRAWN", amountCents: 200 },
    ]);
    expect(balances.pendingCents).toBe(1000);
    expect(balances.availableCents).toBe(300);
    expect(balances.withdrawnCents).toBe(200);
  });
});

describe("LedgerService.validateEntries", () => {
  it("rejeita entradas vazias", () => {
    expect(() => LedgerService.validateEntries([])).toThrow("pelo menos uma entrada");
  });

  it("rejeita montantes não positivos", () => {
    expect(() =>
      LedgerService.validateEntries([
        { walletId: "w1", direction: "CREDIT", balanceBucket: "PENDING", amountCents: 0 },
      ])
    ).toThrow("Montante deve ser positivo");
  });
});
