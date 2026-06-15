/**
 * PATCH /api/promotor/events/[id]/teams/[memberId]
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventTeamPermission } from "@prisma/client";
import { canManageEvents } from "@/lib/auth/member-permissions";
import { assertPromoterEventAccess, TicketManagementAccessError } from "@/lib/auth/ticket-management";
import { requirePromoterApiContext, isPromoterApiContext, apiForbidden } from "@/lib/auth/promoter-api";

export const dynamic = "force-dynamic";

const VALID_PERMISSIONS: EventTeamPermission[] = [
  "CREATE_EVENTS",
  "SELL_TICKETS",
  "VALIDATE_ENTRIES",
  "VIEW_REPORTS",
  "MANAGE_TEAMS",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const ctx = await requirePromoterApiContext();
    if (!isPromoterApiContext(ctx)) return ctx;

    if (!canManageEvents(ctx.role) && ctx.globalRole !== "ADMIN") {
      return apiForbidden("Sem permissão para gerir equipa do evento.");
    }

    const { id: eventId, memberId } = await params;
    await assertPromoterEventAccess(eventId, ctx.orgId, ctx.globalRole ?? "", ctx.userId);

    const member = await prisma.eventTeamMember.findFirst({
      where: { id: memberId, eventId },
    });

    if (!member) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { role, isActive, isVolunteer, notes, permissions } = body;

    const updated = await prisma.eventTeamMember.update({
      where: { id: memberId },
      data: {
        ...(role !== undefined ? { role } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(isVolunteer !== undefined ? { isVolunteer } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(Array.isArray(permissions)
          ? {
              permissions: {
                deleteMany: {},
                create: permissions
                  .filter((perm: string) => VALID_PERMISSIONS.includes(perm as EventTeamPermission))
                  .map((perm: string) => ({ permission: perm as EventTeamPermission })),
              },
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        permissions: true,
      },
    });

    return NextResponse.json({ ok: true, member: updated });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[teams] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
