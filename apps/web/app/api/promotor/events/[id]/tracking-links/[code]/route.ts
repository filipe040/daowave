/**
 * PATCH /api/promotor/events/[id]/tracking-links/[code] — atualiza label
 * DELETE /api/promotor/events/[id]/tracking-links/[code] — remove link
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const UpdateTrackingLinkSchema = z.object({
  label: z.string().max(255).optional().nullable(),
});

async function ensureEventAccess(
  eventId: string,
  session: { user: { id: string } },
  role: string
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { promoterId: true },
  });
  if (!event) return { error: "Event not found" as const, status: 404 };
  if (role === "PROMOTER") {
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!promoter || event.promoterId !== promoter.id) {
      return { error: "Forbidden" as const, status: 403 };
    }
  }
  return { event };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as { role?: string }).role ?? "";
    if (role !== "PROMOTER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId, code } = await params;
    const access = await ensureEventAccess(eventId, session, role);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const body = await req.json();
    const data = UpdateTrackingLinkSchema.parse(body);

    const link = await prisma.trackingLink.findUnique({
      where: { eventId_code: { eventId, code } },
    });
    if (!link) {
      return NextResponse.json({ error: "Tracking link not found" }, { status: 404 });
    }

    const updated = await prisma.trackingLink.update({
      where: { id: link.id },
      data: { label: data.label ?? link.label },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    safeLog.error("Promoter tracking-links update error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as { role?: string }).role ?? "";
    if (role !== "PROMOTER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId, code } = await params;
    const access = await ensureEventAccess(eventId, session, role);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const link = await prisma.trackingLink.findUnique({
      where: { eventId_code: { eventId, code } },
    });
    if (!link) {
      return NextResponse.json({ error: "Tracking link not found" }, { status: 404 });
    }

    await prisma.trackingLink.delete({ where: { id: link.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    safeLog.error("Promoter tracking-links delete error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
