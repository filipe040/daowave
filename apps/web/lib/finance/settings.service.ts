import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { settingsToInput } from "./fee-calculator";
import type { FinancialSettingsInput } from "./types";

export class FinancialSettingsService {
  static async get(tx?: Prisma.TransactionClient): Promise<FinancialSettingsInput> {
    const client = tx ?? prisma;
    let row = await client.financialSettings.findUnique({ where: { id: "default" } });
    if (!row) {
      row = await client.financialSettings.create({ data: { id: "default" } });
    }
    return settingsToInput(row);
  }

  static async update(
    data: Partial<FinancialSettingsInput> & { updatedByUserId?: string },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    return client.financialSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...data,
      },
      update: data,
    });
  }
}
