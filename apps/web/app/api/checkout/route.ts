/**
 * POST /api/checkout
 * Create order and process payment
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payment';
import { generateTicketCode } from '@/lib/utils';
import { getQRPayload } from '@/lib/qr/generate';
import { checkoutSchema } from '@/lib/security/validation';

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

    const body = await request.json();
    const validated = checkoutSchema.parse(body);

    // Verify event exists and is published
    const event = await prisma.event.findUnique({
      where: { id: validated.eventId },
      include: {
        ticketLots: {
          where: {
            id: { in: validated.items.map((i) => i.ticketLotId) },
          },
        },
      },
    });

    if (!event || event.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Event not found or not available' },
        { status: 404 }
      );
    }

    // Verify stock availability and calculate total
    let totalCents = 0;
    const orderItems: Array<{
      ticketLotId: string;
      quantity: number;
      unitPriceCents: number;
    }> = [];

    for (const item of validated.items) {
      const lot = event.ticketLots.find((l) => l.id === item.ticketLotId);
      if (!lot) {
        return NextResponse.json(
          { error: `Ticket lot ${item.ticketLotId} not found` },
          { status: 400 }
        );
      }

      const available = lot.quantityTotal - lot.quantitySold;
      if (item.quantity > available) {
        return NextResponse.json(
          { error: `Insufficient stock for ${lot.name}` },
          { status: 400 }
        );
      }

      orderItems.push({
        ticketLotId: lot.id,
        quantity: item.quantity,
        unitPriceCents: lot.priceCents,
      });

      totalCents += lot.priceCents * item.quantity;
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        eventId: event.id,
        totalCents,
        currency: 'EUR',
        status: 'PENDING',
        items: {
          create: orderItems,
        },
      },
    });

    // Create payment intent
    const paymentProvider = getPaymentProvider();
    const paymentIntent = await paymentProvider.createIntent({
      amount: totalCents,
      currency: 'EUR',
      orderId: order.id,
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      totalCents,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}
