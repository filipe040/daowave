import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/auth/guards";
import { canAccessPromoterAnalytics } from "@/lib/auth/member-permissions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { orgId, role, session } = await requirePromoter();
    const isGlobalAdmin = (session.user as { role?: string }).role === "ADMIN";

    if (!isGlobalAdmin && !canAccessPromoterAnalytics(role)) {
      return NextResponse.json({ error: "Sem permissão para analytics." }, { status: 403 });
    }

    if (!orgId) return NextResponse.json({ data: [] });

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam
      ? new Date(fromParam)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const where: any = {
      status: "PAID",
      createdAt: { gte: from, lte: to },
      event: { organizationId: orgId }
    };

    if (eventId) {
      where.eventId = eventId;
    }

    const orders = await prisma.order.findMany({
      where,
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

    return NextResponse.json({
      data,
      from: from.toISOString(),
      to: to.toISOString()
    });
  } catch (error) {
    console.error("[Analytics API] Error:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
