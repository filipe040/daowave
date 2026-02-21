/**
 * GET /api/promotor/analytics — vendas por dia (opcional: eventId, from, to)
 * Query: eventId?, from (ISO date), to (ISO date). Default: últimos 30 dias
 * Scoped to orgs where the user is OWNER or MANAGER.
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

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const to = toParam ? new Date(toParam) : new Date();
    const from = fromParam
      ? new Date(fromParam)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Scope: organizations where user is OWNER or MANAGER
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId: session.user.id,
        role: { in: ["OWNER", "MANAGER"] },
      },
      select: { organizationId: true },
    });
    const orgIds = memberships.map((m) => m.organizationId);

    // Also check promoterProfile for legacy promoter-scoped events
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Build event scope
    const eventScope =
      eventId
        ? { id: eventId }
        : {
          OR: [
            ...(promoter ? [{ promoterId: promoter.id }] : []),
            ...(orgIds.length > 0 ? [{ organizationId: { in: orgIds } }] : []),
          ],
        };

    if (!promoter && orgIds.length === 0) {
      return NextResponse.json({ data: [], from: from.toISOString(), to: to.toISOString() });
    }

    // Verify the eventId belongs to this user if specified
    if (eventId) {
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          OR: [
            ...(promoter ? [{ promoterId: promoter.id }] : []),
            ...(orgIds.length > 0 ? [{ organizationId: { in: orgIds } }] : []),
          ],
        },
      });
      if (!event) {
        return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
      }
    }

    const orders = await prisma.order.findMany({
      where: {
        status: "PAID",
        createdAt: { gte: from, lte: to },
        event: eventScope,
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
