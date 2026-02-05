/**
 * POST /api/promotor/events/[id]/ticket-lots
 * Create ticket lot/category for event
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId } = await params;
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!promoter) {
      return NextResponse.json({ error: "Promoter profile not found" }, { status: 404 });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        promoterId: promoter.id,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, nominalValue, assetClass, publicIssuance, transferableAsset, quantity, saleStartAt, saleEndAt } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Nome da categoria é obrigatório" }, { status: 400 });
    }

    const priceCents = Math.round((parseFloat(nominalValue || "0") || 0) * 100);
    if (priceCents < 0) {
      return NextResponse.json({ error: "Valor não pode ser negativo" }, { status: 400 });
    }

    // Default dates: sale starts now, ends at event end date
    const startDate = saleStartAt ? new Date(saleStartAt) : new Date();
    const endDate = saleEndAt ? new Date(saleEndAt) : event.endAt;
    
    if (endDate <= startDate) {
      return NextResponse.json({ error: "Data de fim deve ser posterior à data de início" }, { status: 400 });
    }

    const quantityTotal = parseInt(quantity || "100") || 100;
    if (quantityTotal <= 0) {
      return NextResponse.json({ error: "Quantidade deve ser positiva" }, { status: 400 });
    }

    const ticketLot = await prisma.ticketLot.create({
      data: {
        eventId,
        name: title.trim(),
        priceCents,
        currency: "EUR",
        quantityTotal,
        quantitySold: 0,
        saleStartAt: startDate,
        saleEndAt: endDate,
      },
    });

    return NextResponse.json({ ok: true, ticketLot }, { status: 201 });
  } catch (error) {
    console.error("[ticket-lots] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
