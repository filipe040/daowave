/**
 * GET /api/promotor/events/[id]/sales — vendas do evento com paginação e filtros
 * Query: page, limit, status (PAID|PENDING|CANCELED)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";
import type { OrderStatus } from "@prisma/client";

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
    const statusParam = searchParams.get("status");
    const status: OrderStatus | null =
      statusParam === "PAID" || statusParam === "PENDING" || statusParam === "CANCELED"
        ? statusParam
        : null;

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

    const where: { eventId: string; status?: OrderStatus } = { eventId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { ticketLot: { select: { name: true } } } },
          _count: { select: { tickets: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      total,
      page,
      limit,
    });
  } catch (error) {
    safeLog.error("Promoter events sales error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
