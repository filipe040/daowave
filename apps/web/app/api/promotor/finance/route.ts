import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import { requirePromoter } from "@/lib/auth/guards";
import {
  FinanceReportService,
  FinancialSettingsService,
  LedgerService,
  WithdrawalService,
} from "@/lib/finance";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { orgId } = await requirePromoter();
    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") ?? "dashboard";

    if (!orgId) {
      const empty = {
        grossCents: 0,
        platformFeesCents: 0,
        netCents: 0,
        pendingCents: 0,
        availableCents: 0,
        withdrawnCents: 0,
        currency: "EUR",
        salesCount: 0,
        settings: await FinancialSettingsService.get(),
        withdrawals: [],
        transactions: [],
      };
      return NextResponse.json(empty);
    }

    if (view === "dashboard") {
      const [dashboard, withdrawals, settings] = await Promise.all([
        FinanceReportService.getPromoterDashboard(orgId),
        WithdrawalService.list({ organizationId: orgId, limit: 10 }),
        FinancialSettingsService.get(),
      ]);
      return NextResponse.json({
        ...dashboard,
        settings,
        withdrawals: withdrawals.items,
      });
    }

    if (view === "transactions") {
      const page = Number(searchParams.get("page") ?? 1);
      const limit = Number(searchParams.get("limit") ?? 20);
      const result = await LedgerService.listTransactions({
        organizationId: orgId,
        page,
        limit,
      });
      return NextResponse.json(result);
    }

    if (view === "reports") {
      const period = (searchParams.get("period") ?? "monthly") as "daily" | "weekly" | "monthly";
      const report = await FinanceReportService.generateReport(period);
      return NextResponse.json(report);
    }

    return NextResponse.json({ error: "view inválida" }, { status: 400 });
  } catch (error) {
    safeLog.error("Promoter finance error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const withdrawalSchema = z.object({
  amountCents: z.number().int().positive(),
  bankDetails: z.record(z.unknown()).optional(),
});

export async function POST(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { orgId, session } = await requirePromoter();
    if (!orgId) {
      return NextResponse.json({ error: "Organização não encontrada" }, { status: 400 });
    }

    const body = withdrawalSchema.parse(await req.json());
    const withdrawal = await WithdrawalService.requestWithdrawal({
      organizationId: orgId,
      amountCents: body.amountCents,
      bankDetails: body.bankDetails,
      requestedByUserId: session.user.id,
    });

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    safeLog.error("Promoter withdrawal error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
