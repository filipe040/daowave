/**
 * POST /api/promotor/checkin/verify
 * Verify QR code and check-in ticket
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { verifySignedQR } from '@/lib/qr/hmac';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'PROMOTER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { qrCode, eventId } = await request.json();

    if (!qrCode || !eventId) {
      return NextResponse.json(
        { error: 'Missing qrCode or eventId' },
        { status: 400 }
      );
    }

    // Verify QR signature
    const verification = verifySignedQR(qrCode);
    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        { error: verification.error || 'Invalid QR code' },
        { status: 400 }
      );
    }

    const { ticketId } = verification.payload;

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Verify event matches
    if (ticket.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Ticket does not belong to this event' },
        { status: 400 }
      );
    }

    // Check if promoter owns this event
    if (userRole === 'PROMOTER') {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { promoterId: true },
      });

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      const promoter = await prisma.promoterProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!promoter || event.promoterId !== promoter.id) {
        return NextResponse.json(
          { error: 'You do not have access to this event' },
          { status: 403 }
        );
      }
    }

    // Check if already checked in
    if (ticket.checkedInAt) {
      return NextResponse.json({
        success: false,
        message: 'Ticket already checked in',
        checkedInAt: ticket.checkedInAt,
      });
    }

    // Perform check-in
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        checkedInAt: new Date(),
        checkedInByUserId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket checked in successfully',
      ticket: {
        id: ticket.id,
        code: ticket.code,
        checkedInAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Failed to verify ticket' },
      { status: 500 }
    );
  }
}
