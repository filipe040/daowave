/**
 * GET /api/admin/fraud — mínimo: duplicados QR (códigos repetidos), ordens anómalas
 * Query: limit (default 50)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.adminRead);
  if (rateLimitRes) return rateLimitRes;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));

    // Tickets com mais de um check-in (não deveria em modo SINGLE; possível duplicado)
    const duplicateCheckinsGroup = await prisma.checkinLog.groupBy({
      by: ["ticketId"],
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
    });

    // Ordens PAID recentes para detetar padrões anómalos (muitas ordens do mesmo user em pouco tempo)
    const recentOrders = await prisma.order.findMany({
      where: { status: "PAID" },
      select: { userId: true, createdAt: true, id: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const oneHourMs = 60 * 60 * 1000;
    const userMaxOrdersInHour = new Map<string, number>();
    for (const o of recentOrders) {
      const t = new Date(o.createdAt).getTime();
      const inWindow = recentOrders.filter(
        (x) => x.userId === o.userId && Math.abs(new Date(x.createdAt).getTime() - t) <= oneHourMs
      );
      const prev = userMaxOrdersInHour.get(o.userId) ?? 0;
      if (inWindow.length > prev) userMaxOrdersInHour.set(o.userId, inWindow.length);
    }

    const anomalousUsers = Array.from(userMaxOrdersInHour.entries())
      .filter(([, count]) => count >= 5)
      .slice(0, limit)
      .map(([userId, ordersInOneHour]) => ({ userId, ordersInOneHour }));

    return NextResponse.json({
      duplicateCheckinsByTicket: duplicateCheckinsGroup.length,
      duplicateCheckinsSample: duplicateCheckinsGroup.slice(0, 20),
      anomalousUsers,
    });
  } catch (error) {
    safeLog.error("Admin fraud error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
