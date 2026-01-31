/**
 * GET /api/promotor/events/[id]/tracking-links — lista links de rastreio
 * POST /api/promotor/events/[id]/tracking-links — cria link (body: code, label?)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateTrackingLinkSchema = z.object({
  code: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, "Apenas letras minúsculas, números, _ e -"),
  label: z.string().max(255).optional().nullable(),
});

async function ensureEventAccess(
  eventId: string,
  session: { user: { id: string; role?: string } },
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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: eventId } = await params;
    const access = await ensureEventAccess(eventId, session, role);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const links = await prisma.trackingLink.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: links });
  } catch (error) {
    safeLog.error("Promoter tracking-links list error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: eventId } = await params;
    const access = await ensureEventAccess(eventId, session, role);
    if ("error" in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

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
