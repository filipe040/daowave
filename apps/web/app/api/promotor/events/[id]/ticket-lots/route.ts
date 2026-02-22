import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/auth/guards";
import { EventService } from "@/lib/services/event.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, session } = await requirePromoter();
    const globalRole = (session.user as any).role;
    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Permission check: ADMIN bypasses; 
    // PROMOTER must be in the org or be the legacy owner
    if (globalRole !== "ADMIN") {
      const isInOrg = event.organizationId === orgId;

      let ownsViaProfile = false;
      if (!isInOrg) {
        const promoterProfile = await EventService.getPromoterProfile(session.user.id);
        ownsViaProfile = promoterProfile ? event.promoterId === promoterProfile.id : false;
      }

      if (!isInOrg && !ownsViaProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const { title, nominalValue, quantity, saleStartAt, saleEndAt } = body;

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
