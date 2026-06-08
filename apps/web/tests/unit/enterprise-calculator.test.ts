import {
  calculateEnterpriseSplit,
  ProfitBelowMinimumError,
  simulateFinancialScenario,
} from "@/lib/finance/enterprise-calculator";
import { PaymentMethodService } from "@/lib/finance/payment-method.service";

const mbway = {
  code: "MBWAY",
  name: "MB Way",
  fixedFeeEuros: 0.07,
  percentageFee: 0.7,
  vatPercentage: 23,
};

const paysafecard = {
  code: "PAYSAFECARD",
  name: "Paysafecard",
  fixedFeeEuros: 0,
  percentageFee: 12,
  vatPercentage: 23,
};

const baseSettings = {
  serviceFeeType: "PERCENTAGE" as const,
  serviceFeeValue: 5,
  reservePercentage: 5,
  dynamicServiceFee: true,
  minimumProfitPerOrderCents: 100,
  defaultVatPercent: 23,
};

describe("calculateEnterpriseSplit", () => {
  it("ajusta taxa de serviço dinamicamente para MBWAY (exemplo spec)", () => {
    // Bilhete 20€, MBWAY taxa ~0.21€, lucro mínimo 1€ → taxa serviço ≥ 1.21€
    const split = calculateEnterpriseSplit({
      ticketPriceCents: 2000,
      paymentMethod: mbway,
      settings: baseSettings,
      autoAdjustServiceFee: true,
    });
    expect(split.gatewayFeeCents).toBe(21); // 7c + 0.7% de 2000
    expect(split.serviceFeeCents).toBeGreaterThanOrEqual(121);
    expect(split.netPlatformProfitCents).toBeGreaterThanOrEqual(100);
    expect(split.serviceFeeAdjusted).toBe(true);
  });

  it("calcula total cliente com IVA sobre taxa de serviço", () => {
    const split = calculateEnterpriseSplit({
      ticketPriceCents: 2000,
      paymentMethod: mbway,
      settings: {
        ...baseSettings,
        dynamicServiceFee: false,
        serviceFeeValue: 5,
        minimumProfitPerOrderCents: 50,
      },
      autoAdjustServiceFee: false,
      enforceMinimumProfit: false,
    });
    expect(split.serviceFeeCents).toBe(100); // 5% de 20€
    expect(split.vatCents).toBeGreaterThan(0);
    expect(split.totalCustomerCents).toBe(split.ticketPriceCents + split.serviceFeeCents + split.vatCents);
  });

  it("bloqueia venda quando lucro abaixo do mínimo e sem auto-ajuste", () => {
    expect(() =>
      calculateEnterpriseSplit({
        ticketPriceCents: 2000,
        paymentMethod: paysafecard,
        settings: {
          ...baseSettings,
          dynamicServiceFee: false,
          serviceFeeValue: 1, // 1% = 20c, gateway 12% = 240c
        },
        autoAdjustServiceFee: false,
        enforceMinimumProfit: true,
      })
    ).toThrow(ProfitBelowMinimumError);
  });

  it("distribui reserva e saldo promotor", () => {
    const split = calculateEnterpriseSplit({
      ticketPriceCents: 10000,
      paymentMethod: mbway,
      settings: baseSettings,
    });
    expect(split.reserveCents).toBe(500); // 5%
    expect(split.promoterNetCents).toBe(9500);
    expect(split.promoterNetCents + split.reserveCents).toBe(10000);
  });
});

describe("PaymentMethodService.calculateGatewayFeeCents", () => {
  it("calcula taxa fixa + percentagem", () => {
    expect(PaymentMethodService.calculateGatewayFeeCents(2000, mbway)).toBe(21);
    expect(PaymentMethodService.calculateGatewayFeeCents(2000, paysafecard)).toBe(240);
  });
});

describe("simulateFinancialScenario", () => {
  it("devolve breakdown legível", () => {
    const result = simulateFinancialScenario({
      ticketPriceEuros: 20,
      paymentMethodCode: "MBWAY",
      paymentMethod: mbway,
      settings: baseSettings,
    });
    expect(result.breakdown.bilhete).toBe("20.00€");
    expect(result.breakdown.lucroLiquido).toBeDefined();
    expect(parseFloat(result.breakdown.margem)).toBeGreaterThan(0);
  });
});
