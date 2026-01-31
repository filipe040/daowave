/**
 * GET /api/promotor/events/[id]/checkins — lista de check-ins do evento (paginação)
 * Query: page, limit
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "PROMOTER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { promoterId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (role === "PROMOTER") {
      const promoter = await prisma.promoterProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!promoter || event.promoterId !== promoter.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [checkins, total] = await Promise.all([
      prisma.checkinLog.findMany({
        where: { eventId },
        orderBy: { scannedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ticket: { select: { code: true, checkedInAt: true } },
          validator: { select: { name: true, email: true } },
        },
      }),
      prisma.checkinLog.count({ where: { eventId } }),
    ]);

    return NextResponse.json({
      data: checkins,
      total,
      page,
      limit,
    });
  } catch (error) {
    safeLog.error("Promoter events checkins error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
