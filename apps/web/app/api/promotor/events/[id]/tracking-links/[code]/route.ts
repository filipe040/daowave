/**
 * PATCH /api/promotor/events/[id]/tracking-links/[code]
 * DELETE /api/promotor/events/[id]/tracking-links/[code]
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";
import { z } from "zod";
import { getPromoterContext } from "@/lib/auth/guards";
import { canManageEvents } from "@/lib/auth/member-permissions";
import { assertPromoterEventAccess, TicketManagementAccessError } from "@/lib/auth/ticket-management";

export const dynamic = "force-dynamic";

const UpdateTrackingLinkSchema = z.object({
  label: z.string().max(255).optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; code: string }> }
) {
  try {
    const ctx = await getPromoterContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageEvents(ctx.role) && ctx.globalRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId, code } = await params;
    await assertPromoterEventAccess(
      eventId,
      ctx.orgId,
      ctx.globalRole ?? "",
      ctx.userId
    );

    const body = await req.json();
    const data = UpdateTrackingLinkSchema.parse(body);

    const link = await prisma.trackingLink.update({
      where: { eventId_code: { eventId, code } },
      data: { label: data.label ?? null },
    });
    return NextResponse.json(link);
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    safeLog.error("Promoter tracking-link update error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; code: string }> }
) {
  try {
    const ctx = await getPromoterContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!canManageEvents(ctx.role) && ctx.globalRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId, code } = await params;
    await assertPromoterEventAccess(
      eventId,
      ctx.orgId,
      ctx.globalRole ?? "",
      ctx.userId
    );

    await prisma.trackingLink.delete({
      where: { eventId_code: { eventId, code } },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    safeLog.error("Promoter tracking-link delete error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
