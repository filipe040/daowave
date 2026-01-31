/**
 * GET /api/admin/promoters — lista promotores com paginação e filtro por status
 * Query: page, limit, status (PENDING|APPROVED|REJECTED)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";
import type { OrganizerStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const statusParam = searchParams.get("status");
    const status: OrganizerStatus | null =
      statusParam === "PENDING" || statusParam === "APPROVED" || statusParam === "REJECTED"
        ? statusParam
        : null;

    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      prisma.promoterProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { events: true } },
        },
      }),
      prisma.promoterProfile.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    safeLog.error("Admin promoters list error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
