/**
 * GET /api/admin/finance — receita plataforma, payouts, resumo financeiro
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [ordersAgg, payoutsAgg, payoutsByStatus] = await Promise.all([
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalCents: true },
        _count: true,
      }),
      prisma.payout.aggregate({
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.payout.groupBy({
        by: ["status"],
        _sum: { amountCents: true },
        _count: true,
      }),
    ]);

    const gmvCents = ordersAgg._sum.totalCents ?? 0;
    const payoutsTotalCents = payoutsAgg._sum.amountCents ?? 0;
    const paidCents =
      payoutsByStatus.find((p) => p.status === "PAID")?._sum.amountCents ?? 0;
    const pendingCents =
      payoutsByStatus.find((p) => p.status === "PENDING")?._sum.amountCents ?? 0;

    return NextResponse.json({
      gmvCents,
      ordersPaid: ordersAgg._count,
      payoutsTotalCents,
      payoutsPaidCents: paidCents,
      payoutsPendingCents: pendingCents,
      payoutsCount: payoutsAgg._count,
    });
  } catch (error) {
    safeLog.error("Admin finance error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
