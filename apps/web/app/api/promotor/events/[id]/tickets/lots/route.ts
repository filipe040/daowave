/**
 * POST /api/promotor/events/[id]/tickets/lots — Create ticket lot (legacy path).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";
import { canManageTicketContent } from "@/lib/auth/member-permissions";
import { assertPromoterEventAccess, TicketManagementAccessError } from "@/lib/auth/ticket-management";
import { requirePromoterApiContext, isPromoterApiContext, apiForbidden } from "@/lib/auth/promoter-api";

const TicketLotSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.number().int().positive("Preço deve ser positivo"),
  startsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato de data inválido"),
  endsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Formato de data inválido"),
  stockTotal: z.number().int().positive("Quantidade deve ser positiva"),
}).refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
  message: "Data de fim deve ser posterior à data de início",
  path: ["endsAt"],
});

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requirePromoterApiContext();
  if (!isPromoterApiContext(ctx)) return ctx;

  if (!canManageTicketContent(ctx.role) && ctx.globalRole !== "ADMIN") {
    return apiForbidden("Sem permissão para gerir bilhetes.");
  }

  const { id } = await params;

  try {
    await assertPromoterEventAccess(id, ctx.orgId, ctx.globalRole ?? "", ctx.userId);

    const body = await req.json();
    const data = TicketLotSchema.parse(body);

    const ticketLot = await prisma.ticketLot.create({
      data: {
        eventId: id,
        name: data.name,
        priceCents: data.price,
        saleStartAt: new Date(data.startsAt),
        saleEndAt: new Date(data.endsAt),
        quantityTotal: data.stockTotal,
        quantitySold: 0,
      },
    });

    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: ctx.userId,
      action: "TICKET_LOT_CREATED",
      entityType: "ticketLot",
      entityId: ticketLot.id,
      details: {
        eventId: id,
        name: data.name,
        price: data.price,
        stockTotal: data.stockTotal,
      },
      ...metadata,
    });

    safeLog.info(`Ticket lot created: ${ticketLot.id}`, { ticketLotId: ticketLot.id, eventId: id });

    return NextResponse.json({ ticketLot }, { status: 201 });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    safeLog.error("Error creating ticket lot", error);
    return NextResponse.json({ error: "Failed to create ticket lot" }, { status: 500 });
  }
}
