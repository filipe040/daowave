import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export class FinancialAuditService {
  static async log(
    params: {
      actorUserId?: string | null;
      action: string;
      entityType: string;
      entityId?: string | null;
      transactionId?: string | null;
      beforeJson?: Prisma.InputJsonValue;
      afterJson?: Prisma.InputJsonValue;
      ip?: string | null;
      userAgent?: string | null;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx ?? prisma;
    return client.financialAuditLog.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        transactionId: params.transactionId ?? null,
        beforeJson: params.beforeJson,
        afterJson: params.afterJson,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  }
}
