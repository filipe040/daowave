import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessFinanceAdmin } from "@/lib/finance/auth-guard";
import { safeLog } from "@/lib/security";
import {
  FinanceReportService,
  FinancialSettingsService,
  LedgerService,
  RefundService,
  WithdrawalService,
} from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const view = searchParams.get("view") ?? "dashboard";

    if (view === "dashboard") {
      const dashboard = await FinanceReportService.getAdminDashboard();
      return NextResponse.json(dashboard);
    }

    if (view === "transactions") {
      const page = Number(searchParams.get("page") ?? 1);
      const limit = Number(searchParams.get("limit") ?? 20);
      const organizationId = searchParams.get("organizationId") ?? undefined;
      const result = await LedgerService.listTransactions({ page, limit, organizationId });
      return NextResponse.json(result);
    }

    if (view === "withdrawals") {
      const page = Number(searchParams.get("page") ?? 1);
      const limit = Number(searchParams.get("limit") ?? 20);
      const status = searchParams.get("status") as import("@prisma/client").WithdrawalStatus | null;
      const result = await WithdrawalService.list({
        page,
        limit,
        ...(status && { status }),
      });
      return NextResponse.json(result);
    }

    if (view === "refunds") {
      const page = Number(searchParams.get("page") ?? 1);
      const limit = Number(searchParams.get("limit") ?? 20);
      const result = await RefundService.list({ page, limit });
      return NextResponse.json(result);
    }

    if (view === "settings") {
      const settings = await FinancialSettingsService.get();
      return NextResponse.json(settings);
    }

    return NextResponse.json({ error: "view inválida" }, { status: 400 });
  } catch (error) {
    safeLog.error("Admin finance error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await FinancialSettingsService.update({
      ...body,
      updatedByUserId: session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    safeLog.error("Admin finance settings error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
