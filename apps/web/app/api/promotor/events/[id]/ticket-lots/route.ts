import { NextResponse } from "next/server";
import { TicketLotService } from "@/lib/services/ticket-lot.service";
import { requirePromoter } from "@/lib/auth/guards";
import { assertPromoterEventAccess, canEditTicketInventory, TicketManagementAccessError } from "@/lib/auth/ticket-management";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, role, orgId, userId } = await requirePromoter();
    const globalRole = (session.user as { role?: string }).role;
    const { id: eventId } = await params;

    await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

    const lots = await TicketLotService.getByEvent(eventId);
    return NextResponse.json({
      ticketLots: lots,
      meta: { canEdit: canEditTicketInventory(globalRole, role) },
    });
  } catch (error: unknown) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Erro";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, role } = await requirePromoter();
    const globalRole = (session.user as any).role;

    // RBAC check
    if (globalRole !== "ADMIN" && !["PROMOTER_OWNER", "PROMOTER_MANAGER", "OWNER", "MANAGER"].includes(role as string)) {
      return NextResponse.json({ error: "Permissões insuficientes." }, { status: 403 });
    }

    const { id: eventId } = await params;
    const body = await req.json().catch(() => ({}));

    // Backwards compatible parsing
    const name = body.name || body.title;
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Nome da categoria é obrigatório" }, { status: 400 });
    }

    const priceCents = body.priceCents ?? Math.round((parseFloat(body.nominalValue || "0") || 0) * 100);
    if (priceCents < 0) {
      return NextResponse.json({ error: "Valor não pode ser negativo" }, { status: 400 });
    }

    const capacity = body.capacity ?? (parseInt(body.quantity || "100") || 100);
    if (capacity <= 0) {
      return NextResponse.json({ error: "Quantidade deve ser positiva" }, { status: 400 });
    }

    const startsAt = body.startsAt ? new Date(body.startsAt) : (body.saleStartAt ? new Date(body.saleStartAt) : new Date());
    const endsAt = body.endsAt ? new Date(body.endsAt) : (body.saleEndAt ? new Date(body.saleEndAt) : undefined);

    const newLot = await TicketLotService.create(eventId, {
      name: name.trim(),
      description: body.description,
      priceCents,
      capacity,
      startsAt,
      endsAt,
      status: body.status || "ACTIVE",
      perUserLimit: body.perUserLimit ? parseInt(body.perUserLimit) : undefined,
      ticketTypeId: body.ticketTypeId
    });

    safeLog.info("ticket_lot.created", { eventId, lotId: newLot.id, capacity: newLot.capacity });

    return NextResponse.json({ ok: true, ticketLot: newLot, success: true }, { status: 201 });
  } catch (error: any) {
    console.error("[ticket-lots] POST error:", error);
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 });
  }
}
