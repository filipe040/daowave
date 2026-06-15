/**
 * POST /api/promotor/events/[id]/checkin/scan — validar QR e fazer check-in (idempotente)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CheckinService } from "@/lib/services/checkin.service";
import { applyRateLimit, RATE_LIMITS, safeLog } from "@/lib/security";
import { getPromoterContext } from "@/lib/auth/guards";
import { canCheckIn } from "@/lib/auth/member-permissions";
import { assertPromoterEventAccess, TicketManagementAccessError } from "@/lib/auth/ticket-management";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.promotorCheckin);
  if (rateLimitRes) return rateLimitRes;

  try {
    const ctx = await getPromoterContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canCheckIn(ctx.role) && ctx.globalRole !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão para check-in" }, { status: 403 });
    }

    const { id: eventId } = await params;
    await assertPromoterEventAccess(
      eventId,
      ctx.orgId,
      ctx.globalRole ?? "",
      ctx.userId
    );

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
      ctx.userId
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

    const status = result.resultType === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: result.message }, { status });
  } catch (error) {
    if (error instanceof TicketManagementAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    safeLog.error("Promoter checkin scan error", error);
    return NextResponse.json({ error: "Failed to verify ticket" }, { status: 500 });
  }
}
