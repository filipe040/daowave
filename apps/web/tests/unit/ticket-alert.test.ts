import { PaymentMethodService } from "@/lib/finance/payment-method.service";

// Testes de lógica pura do cálculo de disponibilidade (espelho da lógica do serviço)
function isLotPurchasable(
  lot: {
    startsAt: Date | null;
    endsAt: Date | null;
    saleStartAt: Date;
    saleEndAt: Date;
    capacity: number;
    quantityTotal: number;
    soldCount: number;
    quantitySold: number;
  },
  now: Date
) {
  const start = lot.startsAt ?? lot.saleStartAt;
  const end = lot.endsAt ?? lot.saleEndAt;
  if (start > now || end < now) return false;
  const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
  const sold = lot.soldCount > 0 ? lot.soldCount : lot.quantitySold;
  return sold < capacity;
}

describe("ticket availability logic", () => {
  const future = new Date("2026-12-01T10:00:00Z");
  const past = new Date("2026-01-01T10:00:00Z");
  const now = new Date("2026-06-15T12:00:00Z");

  const baseLot = {
    startsAt: null as Date | null,
    endsAt: null as Date | null,
    saleStartAt: past,
    saleEndAt: future,
    capacity: 100,
    quantityTotal: 100,
    soldCount: 0,
    quantitySold: 0,
  };

  it("disponível quando dentro da janela de venda e com stock", () => {
    expect(isLotPurchasable(baseLot, now)).toBe(true);
  });

  it("indisponível antes da data de abertura de venda", () => {
    expect(
      isLotPurchasable(
        { ...baseLot, saleStartAt: new Date("2026-07-01T00:00:00Z") },
        now
      )
    ).toBe(false);
  });

  it("indisponível quando esgotado", () => {
    expect(
      isLotPurchasable({ ...baseLot, soldCount: 100, quantitySold: 100 }, now)
    ).toBe(false);
  });
});

// smoke test unrelated import to keep jest happy with module graph
describe("PaymentMethodService", () => {
  it("exports calculateGatewayFeeCents", () => {
    expect(typeof PaymentMethodService.calculateGatewayFeeCents).toBe("function");
  });
});
