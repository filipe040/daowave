import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePromoter } from "@/lib/auth/guards";
import {
  assertPromoterEventAccess,
  canEditTicketInventory,
  TicketManagementAccessError,
} from "@/lib/auth/ticket-management";
import { TicketLotService } from "@/lib/services/ticket-lot.service";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";
import { TicketAlertService } from "@/lib/services/ticket-alert.service";

export const dynamic = "force-dynamic";

const updateLotSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  priceCents: z.number().int().min(0).optional(),
  capacity: z.number().int().positive().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().nullable(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
  ticketTypeId: z.string().uuid().nullable().optional(),
  perUserLimit: z.number().int().positive().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; lotId: string }> }
) {
  try {
    const { session, role, orgId, userId } = await requirePromoter();
    const globalRole = (session.user as { role?: string }).role;

    if (!canEditTicketInventory(globalRole, role)) {
      return NextResponse.json(
        { error: "Apenas o proprietário da organização ou administrador pode editar lotes." },
        { status: 403 }
      );
    }

    const { id: eventId, lotId } = await params;
    await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

    const existing = await prisma.ticketLot.findFirst({
      where: { id: lotId, eventId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    const body = updateLotSchema.parse(await req.json());
    const sold = existing.soldCount ?? existing.quantitySold ?? 0;

    if (body.capacity !== undefined && body.capacity < sold) {
      return NextResponse.json(
        { error: `A capacidade não pode ser inferior aos ${sold} bilhete(s) já vendidos.` },
        { status: 400 }
      );
    }

    if (body.ticketTypeId) {
      const type = await prisma.ticketType.findFirst({
        where: { id: body.ticketTypeId, eventId },
      });
      if (!type) {
        return NextResponse.json({ error: "Tipo de bilhete inválido para este evento." }, { status: 400 });
      }
    }

    const updated = await TicketLotService.update(lotId, {
      name: body.name,
      description: body.description ?? undefined,
      priceCents: body.priceCents,
      capacity: body.capacity,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
      endsAt: body.endsAt ? new Date(body.endsAt) : body.endsAt === null ? undefined : undefined,
      status: body.status,
      ticketTypeId: body.ticketTypeId === null ? undefined : body.ticketTypeId,
      perUserLimit: body.perUserLimit === null ? undefined : body.perUserLimit,
    });

    if (body.priceCents !== undefined && body.priceCents !== existing.priceCents) {
      const metadata = getRequestMetadata(req);
      await createAuditLog({
        userId,
        action: "TICKET_LOT_PRICE_CHANGED",
        entityType: "ticketLot",
        entityId: lotId,
        details: {
          eventId,
          lotName: existing.name,
          previousPrice: existing.priceCents,
          newPrice: body.priceCents,
        },
        ...metadata,
      });
      safeLog.info("ticket_lot.price_changed", { lotId, eventId });
    }

    TicketAlertService.notifyIfTicketsAvailable(eventId).catch((e) => console.error(e));

    return NextResponse.json({ success: true, ticketLot: updated });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    console.error("[ticket-lots PATCH] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar lote" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; lotId: string }> }
) {
  try {
    const { session, role, orgId, userId } = await requirePromoter();
    const globalRole = (session.user as { role?: string }).role;

    if (!canEditTicketInventory(globalRole, role)) {
      return NextResponse.json(
        { error: "Apenas o proprietário da organização ou administrador pode apagar lotes." },
        { status: 403 }
      );
    }

    const { id: eventId, lotId } = await params;
    await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

    const existing = await prisma.ticketLot.findFirst({ where: { id: lotId, eventId } });
    if (!existing) {
      return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
    }

    await TicketLotService.delete(lotId);

    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId,
      action: "TICKET_LOT_DELETED",
      entityType: "ticketLot",
      entityId: lotId,
      details: { eventId, lotName: existing.name },
      ...metadata,
    });
    safeLog.info("ticket_lot.deleted", { lotId, eventId });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Erro ao apagar lote";
    const status = message.includes("Não é possível") ? 400 : 500;
    console.error("[ticket-lots DELETE] error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
