/**
 * GET /api/promotor/events/[id]/tracking-links — lista links de rastreio
 * POST /api/promotor/events/[id]/tracking-links — cria link (body: code, label?)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";
import { z } from "zod";
import { getPromoterContext } from "@/lib/auth/guards";
import { canManageEvents } from "@/lib/auth/member-permissions";
import { assertPromoterEventAccess, TicketManagementAccessError } from "@/lib/auth/ticket-management";

export const dynamic = "force-dynamic";

const CreateTrackingLinkSchema = z.object({
  code: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, "Apenas letras minúsculas, números, _ e -"),
  label: z.string().max(255).optional().nullable(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getPromoterContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    await assertPromoterEventAccess(
      eventId,
      ctx.orgId,
      ctx.globalRole ?? "",
      ctx.userId
    );

    const links = await prisma.trackingLink.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: links });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    safeLog.error("Promoter tracking-links list error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getPromoterContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canManageEvents(ctx.role) && ctx.globalRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId } = await params;
    await assertPromoterEventAccess(
      eventId,
      ctx.orgId,
      ctx.globalRole ?? "",
      ctx.userId
    );

    const body = await req.json();
    const data = CreateTrackingLinkSchema.parse(body);

    const existing = await prisma.trackingLink.findUnique({
      where: { eventId_code: { eventId, code: data.code } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe um link com este código para este evento" },
        { status: 400 }
      );
    }

    const link = await prisma.trackingLink.create({
      data: {
        eventId,
        code: data.code,
        label: data.label ?? null,
      },
    });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    safeLog.error("Promoter tracking-links create error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
