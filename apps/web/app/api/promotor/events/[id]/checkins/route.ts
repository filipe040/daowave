import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeLog } from "@/lib/security";
import { requirePromoter } from "@/lib/auth/guards";
import { EventService } from "@/lib/services/event.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, session } = await requirePromoter();
    const globalRole = (session.user as any).role;
    const { id: eventId } = await params;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { promoterId: true, organizationId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Permission check: ADMIN bypasses; 
    // PROMOTER must be in the org or be the legacy owner
    if (globalRole !== "ADMIN") {
      const isInOrg = event.organizationId === orgId;

      let ownsViaProfile = false;
      if (!isInOrg) {
        const promoterProfile = await EventService.getPromoterProfile(session.user.id);
        ownsViaProfile = promoterProfile ? event.promoterId === promoterProfile.id : false;
      }

      if (!isInOrg && !ownsViaProfile) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const [checkins, total] = await Promise.all([
      prisma.checkinLog.findMany({
        where: { eventId },
        orderBy: { scannedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ticket: { select: { code: true, checkedInAt: true } },
          validator: { select: { name: true, email: true } },
        },
      }),
      prisma.checkinLog.count({ where: { eventId } }),
    ]);

    return NextResponse.json({
      data: checkins,
      total,
      page,
      limit,
    });
  } catch (error) {
    safeLog.error("Promoter events checkins error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
