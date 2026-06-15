/**
 * POST /api/promotor/events/[id]/teams
 * Add new team member to event
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requirePromoterApiContext();
    if (!isPromoterApiContext(ctx)) return ctx;

    if (!canManageEvents(ctx.role) && ctx.globalRole !== "ADMIN") {
      return apiForbidden("Sem permissão para gerir equipa do evento.");
    }

    const { id: eventId } = await params;
    await assertPromoterEventAccess(eventId, ctx.orgId, ctx.globalRole ?? "", ctx.userId);

    const body = await request.json().catch(() => ({}));
    const { email, role, isActive, isVolunteer, notes, permissions } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      // Create user without password (they'll need to set it via email)
      user = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          name: email.split("@")[0],
          passwordHash: "", // Temporary, should send invitation email
          role: "USER",
        },
      });
    }

    // Check if member already exists
    const existingMember = await prisma.eventTeamMember.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "Este utilizador já é membro da equipa" }, { status: 400 });
    }

    // Create team member
    const member = await prisma.eventTeamMember.create({
      data: {
        eventId,
        userId: user.id,
        role: role || "STAFF",
        isActive: isActive !== undefined ? isActive : true,
        isVolunteer: isVolunteer !== undefined ? isVolunteer : false,
        notes: notes || null,
        permissions: {
          create: (permissions || [])
            .filter((perm: string) => VALID_PERMISSIONS.includes(perm as EventTeamPermission))
            .map((perm: string) => ({
              permission: perm as EventTeamPermission,
            })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, member });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[teams] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
