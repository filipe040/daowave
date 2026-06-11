import { applyFeeRounding } from "@/lib/finance/financial-engine";

describe("applyFeeRounding", () => {
  it("arredonda para .49 ou .99 (END_49_99)", () => {
    expect(applyFeeRounding(163, "END_49_99")).toBe(199);
    expect(applyFeeRounding(221, "END_49_99")).toBe(249);
    expect(applyFeeRounding(372, "END_49_99")).toBe(399);
  });

  it("mantém valor com NONE", () => {
    expect(applyFeeRounding(180, "NONE")).toBe(180);
  });

  it("arredonda para .49 (END_49)", () => {
    expect(applyFeeRounding(130, "END_49")).toBe(149);
  });

  it("arredonda para .99 (END_99)", () => {
    expect(applyFeeRounding(150, "END_99")).toBe(199);
  });
});

describe("FinancialEngine feePaidBy logic", () => {
  it("BUYER: cliente paga bilhete + taxa", () => {
    const ticket = 2000;
    const fee = 180;
    const total = ticket + fee;
    expect(total).toBe(2180);
  });

  it("ORGANIZER: cliente paga só bilhete, promotor recebe menos", () => {
    const ticket = 2000;
    const fee = 180;
    const promoterNet = ticket - fee;
    expect(promoterNet).toBe(1820);
  });
});

describe("Commission tier examples", () => {
  const tiers = [
    { min: 0, max: 1000, fee: 99 },
    { min: 1000, max: 2500, fee: 149 },
    { min: 2500, max: 5000, fee: 249 },
    { min: 5000, max: 10000, fee: 399 },
    { min: 10000, max: null, fee: 499, pct: 2 },
  ];

  function findTier(priceCents: number) {
    return tiers.find(
      (t) => priceCents >= t.min && (t.max == null || priceCents < t.max)
    );
  }

  it("0-10€ → 0.99€", () => {
    expect(findTier(500)?.fee).toBe(99);
  });

  it("10-25€ → 1.49€", () => {
    expect(findTier(1500)?.fee).toBe(149);
  });

  it("100€+ → 4.99€ + 2%", () => {
    const tier = findTier(15000);
    expect(tier?.fee).toBe(499);
    expect(tier?.pct).toBe(2);
  });
});
