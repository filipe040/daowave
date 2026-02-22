import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import { requirePromoter } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { orgId } = await requirePromoter();

    if (!orgId) {
      return NextResponse.json({
        grossCents: 0,
        currency: "EUR",
        feesCents: 0,
        netCents: 0,
        payoutsPaidCents: 0,
        payoutsPendingCents: 0,
        payouts: [],
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        status: "PAID",
        event: { organizationId: orgId },
      },
      select: { totalCents: true, currency: true },
    });

    const grossCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
    const currency = orders[0]?.currency ?? "EUR";

    const payouts = await prisma.payout.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const paidCents = payouts
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amountCents, 0);
    const pendingCents = payouts
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amountCents, 0);

    return NextResponse.json({
      grossCents,
      currency,
      feesCents: 0,
      netCents: grossCents,
      payoutsPaidCents: paidCents,
      payoutsPendingCents: pendingCents,
      payouts: payouts.slice(0, 10),
    });
  } catch (error) {
    safeLog.error("Promoter finance error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
