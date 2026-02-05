/**
 * GET /api/promotor/finance — receita bruta, payouts e resumo financeiro do promotor
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "PROMOTER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!promoter || promoter.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Promoter profile not found or not approved" },
        { status: 403 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        status: "PAID",
        event: { promoterId: promoter.id },
      },
      select: { totalCents: true, currency: true },
    });

    const grossCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
    const currency = orders[0]?.currency ?? "EUR";

    const payouts = await prisma.payout.findMany({
      where: { promoterId: promoter.id },
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
