/**
 * POST /api/payments/confirm
 * Confirm payment and issue tickets
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payment';
import { generateTicketCode } from '@/lib/utils';
import { getQRPayload } from '@/lib/qr/generate';
import { sendTicketsEmail } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, paymentIntentId } = await request.json();

    if (!orderId || !paymentIntentId) {
      return NextResponse.json({ error: 'Missing orderId or paymentIntentId' }, { status: 400 });
    }

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { ticketLot: true } },
        event: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (order.status === 'PAID') {
      // Already paid — attempt to resend email in case it was missed
      sendTicketsEmail(orderId).catch((e) => console.error('[confirm] resend email error:', e));
      return NextResponse.json({ success: true, orderId: order.id, message: 'Order already paid' });
    }

    // Confirm payment with provider
    const paymentProvider = getPaymentProvider();
    const paymentResult = await paymentProvider.confirmPayment(paymentIntentId);

    if (!paymentResult.success) {
      return NextResponse.json({ error: paymentResult.error || 'Payment failed' }, { status: 400 });
    }

    // Update order status and create tickets (atomic)
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentProvider: 'mock',
          paymentRef: paymentResult.paymentRef,
        },
      });

      for (const item of order.items) {
        for (let i = 0; i < item.quantity; i++) {
          const code = generateTicketCode();

          const ticket = await tx.ticket.create({
            data: {
              orderId: order.id,
              eventId: order.eventId,
              userId: order.userId,
              ticketLotId: item.ticketLotId,
              code,
              qrPayload: '',
            },
          });

          const finalQRPayload = getQRPayload({ ticketId: ticket.id, code });

          await tx.ticket.update({
            where: { id: ticket.id },
            data: { qrPayload: finalQRPayload },
          });

          await tx.ticketLot.update({
            where: { id: item.ticketLotId },
            data: { quantitySold: { increment: 1 } },
          });
        }
      }
    });

    // ✅ Send ticket email + invoice PDF after successful payment
    try {
      await sendTicketsEmail(orderId);
    } catch (emailErr) {
      console.error('[confirm] Error sending ticket email:', emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: 'Payment confirmed and tickets issued',
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
