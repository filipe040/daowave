/**
 * GET /api/admin/promoters/[id] — detalhe do promotor
 * PATCH /api/admin/promoters/[id] — atualiza score, adminNotes, status (bloquear = REJECTED)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMetadata, safeLog } from "@/lib/security";
import { z } from "zod";
import type { OrganizerStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const UpdatePromoterSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  adminNotes: z.string().max(5000).nullable().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const promoter = await prisma.promoterProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true } },
        _count: { select: { events: true } },
        events: { select: { id: true, title: true, slug: true, status: true } },
      },
    });

    if (!promoter) {
      return NextResponse.json({ error: "Promoter not found" }, { status: 404 });
    }

    return NextResponse.json(promoter);
  } catch (error) {
    safeLog.error("Admin promoter get error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const promoter = await prisma.promoterProfile.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });

    if (!promoter) {
      return NextResponse.json({ error: "Promoter not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = UpdatePromoterSchema.parse(body);

    const updateData: { status?: OrganizerStatus; score?: number | null; adminNotes?: string | null } = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;

    const updated = await prisma.promoterProfile.update({
      where: { id },
      data: updateData,
    });

    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: session.user.id,
      action: "ADMIN_PROMOTER_UPDATE",
      entityType: "promoter",
      entityId: id,
      details: { previousStatus: promoter.status, ...updateData },
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    safeLog.error("Admin promoter update error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
