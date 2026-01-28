/**
 * PATCH /api/promotor/events/[id]/teams/[memberId]
 * Update team member
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { EventTeamPermission } from "@prisma/client";

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string })?.role;
    if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId, memberId } = await params;
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

    const member = await prisma.eventTeamMember.findFirst({
      where: {
        id: memberId,
        eventId,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { role, isActive, isVolunteer, notes, permissions } = body;

    // Update member
    await prisma.eventTeamMember.update({
      where: { id: memberId },
      data: {
        role: role !== undefined ? role : member.role,
        isActive: isActive !== undefined ? isActive : member.isActive,
        isVolunteer: isVolunteer !== undefined ? isVolunteer : member.isVolunteer,
        notes: notes !== undefined ? (notes || null) : member.notes,
      },
    });

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Delete existing permissions
      await prisma.eventTeamMemberPermission.deleteMany({
        where: { memberId },
      });

      // Create new permissions (validate and filter invalid ones)
      const validPermissions = permissions
        .filter((perm: string) => VALID_PERMISSIONS.includes(perm as EventTeamPermission))
        .map((perm: string) => ({
          memberId,
          permission: perm as EventTeamPermission,
        }));

      if (validPermissions.length > 0) {
        await prisma.eventTeamMemberPermission.createMany({
          data: validPermissions,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[teams] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
