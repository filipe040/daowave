import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FinancialSettingsService } from "@/lib/finance/settings.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const profile = await FinancialSettingsService.getPromoterProfile(id);
    const global = await FinancialSettingsService.get();
    return NextResponse.json({ profile, globalDefaults: global });
  } catch (error) {
    safeLog.error("Org financial settings GET error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    const updated = await FinancialSettingsService.upsertPromoterProfile(id, {
      pricingMode: body.pricingMode,
      customFixedFeeCents:
        body.customFixedFeeEuros != null ? Math.round(Number(body.customFixedFeeEuros) * 100) : body.customFixedFeeCents,
      customPercentageFee: body.customPercentageFee != null ? Number(body.customPercentageFee) : undefined,
      customMinimumFeeCents:
        body.customMinimumFeeEuros != null
          ? Math.round(Number(body.customMinimumFeeEuros) * 100)
          : body.customMinimumFeeCents,
      customMaximumFeeCents:
        body.customMaximumFeeEuros != null
          ? Math.round(Number(body.customMaximumFeeEuros) * 100)
          : body.customMaximumFeeCents,
      customOperationalReserveCents:
        body.customOperationalReserveEuros != null
          ? Math.round(Number(body.customOperationalReserveEuros) * 100)
          : body.customOperationalReserveCents,
      feePaidBy: body.feePaidBy,
      settlementFrequency: body.settlementFrequency,
      active: body.active,
      reservePercentage: body.reservePercentage != null ? Number(body.reservePercentage) : undefined,
      payoutDelayDays: body.payoutDelayDays != null ? Number(body.payoutDelayDays) : undefined,
      updatedByUserId: session.user.id,
    });
    return NextResponse.json(updated);
  } catch (error) {
    safeLog.error("Org financial settings PUT error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
