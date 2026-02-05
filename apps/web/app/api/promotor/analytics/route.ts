/**
 * GET /api/promotor/analytics — vendas por dia (opcional: eventId, from, to)
 * Query: eventId?, from (ISO date), to (ISO date). Default: últimos 30 dias do promotor
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

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam
      ? new Date(fromParam)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (eventId && role === "PROMOTER") {
      const event = await prisma.event.findFirst({
        where: { id: eventId, promoterId: promoter.id },
      });
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
    }

    const orders = await prisma.order.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: from, lte: to },
        event: eventId
          ? { id: eventId, promoterId: promoter.id }
          : { promoterId: promoter.id },
      },
      select: { totalCents: true, createdAt: true },
    });

    const byDay: Record<string, number> = {};
    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      byDay[key] = (byDay[key] ?? 0) + o.totalCents;
    }

    const data = Object.entries(byDay)
      .map(([date, revenueCents]) => ({ date, revenueCents }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ data, from: from.toISOString(), to: to.toISOString() });
  } catch (error) {
    safeLog.error("Promoter analytics error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
