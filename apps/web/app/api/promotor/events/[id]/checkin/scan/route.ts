/**
 * POST /api/promotor/events/[id]/checkin/scan — validar QR e fazer check-in (idempotente)
 * Body: { qrCode }. eventId vem do path.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckinService } from "@/lib/services/checkin.service";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorCheckin);
  if (rateLimitRes) return rateLimitRes;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role ?? "";
    if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: eventId } = await params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { promoterId: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (userRole === "PROMOTER") {
      const promoter = await prisma.promoterProfile.findUnique({
        where: { userId: session.user.id },
      });
      if (!promoter || event.promoterId !== promoter.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await req.json();
    const qrCode = body?.qrCode;
    const deviceId = body?.deviceId ?? null;
    if (!qrCode) {
      return NextResponse.json({ error: "Missing qrCode" }, { status: 400 });
    }

    const result = await CheckinService.validate(
      qrCode,
      eventId,
      deviceId ?? "UNKNOWN",
      session.user.id
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Ticket checked in successfully",
        ticketHolderName: result.ticketHolderName,
      });
    }

    if (result.resultType === "already_used") {
      return NextResponse.json({
        success: false,
        message: result.message,
        checkedInAt: result.scannedAt,
      });
    }

    const status = result.resultType === 'NOT_FOUND' ? 404 : 400;
    return NextResponse.json({ error: result.message }, { status });
  } catch (error) {
    safeLog.error("Promoter checkin scan error", error);
    return NextResponse.json(
      { error: "Failed to verify ticket" },
      { status: 500 }
    );
  }
}
