import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { decimalToNumber } from "./fee-calculator";

export interface PaymentMethodFees {
  code: string;
  name: string;
  fixedFeeEuros: number;
  percentageFee: number;
  vatPercentage: number;
}

export class PaymentMethodService {
  static async list(activeOnly = true) {
    return prisma.paymentMethod.findMany({
      where: { deletedAt: null, ...(activeOnly && { active: true }) },
      orderBy: { name: "asc" },
    });
  }

  static async getByCode(code: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    const method = await client.paymentMethod.findFirst({
      where: { code: code.toUpperCase(), deletedAt: null, active: true },
    });
    if (!method) {
      throw new Error(`Método de pagamento não encontrado: ${code}`);
    }
    return PaymentMethodService.toFees(method);
  }

  static toFees(row: {
    code: string;
    name: string;
    fixedFee: { toNumber(): number } | number;
    percentageFee: { toNumber(): number } | number;
    vatPercentage: { toNumber(): number } | number;
  }): PaymentMethodFees {
    return {
      code: row.code,
      name: row.name,
      fixedFeeEuros: decimalToNumber(row.fixedFee),
      percentageFee: decimalToNumber(row.percentageFee),
      vatPercentage: decimalToNumber(row.vatPercentage),
    };
  }

  /** Taxa gateway em cêntimos (fixed € + % sobre montante) */
  static calculateGatewayFeeCents(amountCents: number, method: PaymentMethodFees): number {
    const fixed = Math.round(method.fixedFeeEuros * 100);
    const variable = Math.round((amountCents * method.percentageFee) / 100);
    return fixed + variable;
  }

  static async update(
    id: string,
    data: Partial<{
      name: string;
      fixedFee: number;
      percentageFee: number;
      vatPercentage: number;
      active: boolean;
    }>
  ) {
    return prisma.paymentMethod.update({ where: { id }, data });
  }

  static async seedDefaults() {
    const defaults: Array<[string, string, number, number]> = [
      ["MBWAY", "MB Way", 0.07, 0.7],
      ["MULTIBANCO", "Multibanco", 0.2, 1.5],
      ["VISA", "Visa", 0.2, 1.5],
      ["MASTERCARD", "Mastercard", 0.2, 1.5],
      ["APPLE_PAY", "Apple Pay", 0.2, 1.5],
      ["GOOGLE_PAY", "Google Pay", 0.2, 1.5],
      ["EUROPIX", "EuroPix", 0.15, 1.8],
      ["PAYSHOP", "Payshop", 0.6, 0],
      ["SEPA", "SEPA", 0.45, 0],
      ["PAGAQUI", "Pagaqui", 0.3, 0],
      ["PAYSAFECARD", "Paysafecard", 0, 12],
    ];
    for (const [code, name, fixed, pct] of defaults) {
      await prisma.paymentMethod.upsert({
        where: { code },
        create: { name, code, fixedFee: fixed, percentageFee: pct },
        update: {},
      });
    }
  }
}
