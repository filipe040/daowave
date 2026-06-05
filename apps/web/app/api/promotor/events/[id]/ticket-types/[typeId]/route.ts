import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePromoter } from "@/lib/auth/guards";
import {
  assertPromoterEventAccess,
  canEditTicketInventory,
  TicketManagementAccessError,
} from "@/lib/auth/ticket-management";
import { TicketTypeService } from "@/lib/services/ticket-type.service";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

const updateTypeSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  requiresSeat: z.boolean().optional(),
  perUserLimit: z.number().int().positive().nullable().optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { session, role, orgId, userId } = await requirePromoter();
    const globalRole = (session.user as { role?: string }).role;

    if (!canEditTicketInventory(globalRole, role)) {
      return NextResponse.json(
        { error: "Apenas o proprietário da organização ou administrador pode editar tipos de bilhete." },
        { status: 403 }
      );
    }

    const { id: eventId, typeId } = await params;
    await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

    const existing = await prisma.ticketType.findFirst({
      where: { id: typeId, eventId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tipo de bilhete não encontrado" }, { status: 404 });
    }

    const body = updateTypeSchema.parse(await req.json());

    const updated = await TicketTypeService.update(typeId, {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description ?? "" }),
      ...(body.requiresSeat !== undefined && { requiresSeat: body.requiresSeat }),
      ...(body.perUserLimit !== undefined && { perUserLimit: body.perUserLimit ?? undefined }),
      ...(body.status !== undefined && { status: body.status }),
    });

    return NextResponse.json({ success: true, ticketType: updated });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    console.error("[ticket-types PATCH] error:", error);
    return NextResponse.json({ error: "Erro ao atualizar tipo de bilhete" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { session, role, orgId, userId } = await requirePromoter();
    const globalRole = (session.user as { role?: string }).role;

    if (!canEditTicketInventory(globalRole, role)) {
      return NextResponse.json(
        { error: "Apenas o proprietário da organização ou administrador pode apagar tipos de bilhete." },
        { status: 403 }
      );
    }

    const { id: eventId, typeId } = await params;
    await assertPromoterEventAccess(eventId, orgId, globalRole || "", userId);

    const existing = await prisma.ticketType.findFirst({ where: { id: typeId, eventId } });
    if (!existing) {
      return NextResponse.json({ error: "Tipo de bilhete não encontrado" }, { status: 404 });
    }

    await TicketTypeService.delete(typeId);

    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId,
      action: "TICKET_TYPE_DELETED",
      entityType: "ticketType",
      entityId: typeId,
      details: { eventId, typeName: existing.name },
      ...metadata,
    });
    safeLog.info("ticket_type.deleted", { typeId, eventId });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Erro ao apagar tipo de bilhete";
    const status = message.includes("Não é possível") || message.includes("Remova") ? 400 : 500;
    console.error("[ticket-types DELETE] error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
