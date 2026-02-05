/**
 * GET /api/promotor/events/[id]/badge-design
 * PATCH /api/promotor/events/[id]/badge-design
 * Get/Update badge design for event
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: eventId } = await params;
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
      select: {
        badgeTemplateImageUrl: true,
        badgePrefix: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      templateImageUrl: event.badgeTemplateImageUrl,
      prefix: event.badgePrefix,
    });
  } catch (error) {
    console.error("[badge-design] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: eventId } = await params;
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

    const body = await request.json().catch(() => ({}));
    const templateImageUrl =
      typeof body.templateImageUrl === "string" ? body.templateImageUrl.trim() || null : undefined;
    const prefix = typeof body.prefix === "string" ? body.prefix.trim() || null : undefined;

    const updateData: {
      badgeTemplateImageUrl?: string | null;
      badgePrefix?: string | null;
    } = {};
    if (templateImageUrl !== undefined) updateData.badgeTemplateImageUrl = templateImageUrl;
    if (prefix !== undefined) updateData.badgePrefix = prefix || "BADGE";

    await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[badge-design] PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
