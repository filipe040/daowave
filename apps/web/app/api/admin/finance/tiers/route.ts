import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessFinanceAdmin } from "@/lib/finance/auth-guard";
import { CommissionTierService } from "@/lib/finance/tier.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const items = await CommissionTierService.list();
    return NextResponse.json({ items });
  } catch (error) {
    safeLog.error("Admin tiers list error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const tier = await CommissionTierService.create(
      {
        minPriceCents: Math.round(Number(body.minPriceEuros ?? 0) * 100),
        maxPriceCents: body.maxPriceEuros != null ? Math.round(Number(body.maxPriceEuros) * 100) : null,
        fixedFeeCents: Math.round(Number(body.fixedFeeEuros ?? 0) * 100),
        percentageFee: Number(body.percentageFee ?? 0),
        active: body.active ?? true,
        sortOrder: Number(body.sortOrder ?? 0),
      },
      session.user.id
    );
    return NextResponse.json(tier);
  } catch (error) {
    safeLog.error("Admin tier create error", error);
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
    if (!body.id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    const tier = await CommissionTierService.update(
      body.id,
      {
        ...(body.minPriceEuros != null && { minPriceCents: Math.round(Number(body.minPriceEuros) * 100) }),
        ...(body.maxPriceEuros !== undefined && {
          maxPriceCents: body.maxPriceEuros != null ? Math.round(Number(body.maxPriceEuros) * 100) : null,
        }),
        ...(body.fixedFeeEuros != null && { fixedFeeCents: Math.round(Number(body.fixedFeeEuros) * 100) }),
        ...(body.percentageFee != null && { percentageFee: Number(body.percentageFee) }),
        ...(body.active != null && { active: Boolean(body.active) }),
        ...(body.sortOrder != null && { sortOrder: Number(body.sortOrder) }),
      },
      session.user.id
    );
    return NextResponse.json(tier);
  } catch (error) {
    safeLog.error("Admin tier update error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    await CommissionTierService.delete(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    safeLog.error("Admin tier delete error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
