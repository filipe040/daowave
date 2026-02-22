/**
 * POST /api/promotor/checkin/verify
 * Verify QR code and check-in ticket
 */

import { NextResponse } from 'next/server';
import { CheckinService } from '@/lib/services/checkin.service';
import { applyRateLimit, RATE_LIMITS, safeLog } from '@/lib/security';
import { requirePromoter } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rateLimitRes = await applyRateLimit(request, RATE_LIMITS.promotorCheckin);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { session, role: memberRole, orgId } = await requirePromoter();
    const userRole = (session.user as { role?: string }).role ?? '';

    const body = await request.json();
    const { qrCode, eventId, deviceId } = body;

    if (!qrCode || !eventId) {
      return NextResponse.json(
        { error: 'Missing qrCode or eventId' },
        { status: 400 }
      );
    }

    const result = await CheckinService.verifyAndCheckin({
      qrCode,
      eventId,
      userId: session.user.id,
      userRole,
      deviceId: deviceId ?? null,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Ticket checked in successfully',
        ticket: result.ticket,
      });
    }

    if (result.checkedInAt) {
      return NextResponse.json({
        success: false,
        message: result.message,
        checkedInAt: result.checkedInAt,
        checkedInByUserId: result.checkedInByUserId,
        checkedInByName: result.checkedInByName,
      });
    }

    const status = result.message === 'Ticket not found' ? 404 : result.message.includes('event') || result.message.includes('access') ? 403 : 400;
    return NextResponse.json(
      { error: result.message },
      { status }
    );
  } catch (error) {
    safeLog.error('Check-in error', error);
    return NextResponse.json(
      { error: 'Failed to verify ticket' },
      { status: 500 }
    );
  }
}
