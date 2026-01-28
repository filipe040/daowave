/**
 * GET /api/events/[slug]
 * Get event details
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        promoter: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        ticketLots: {
          where: {
            saleStartAt: { lte: new Date() },
            saleEndAt: { gte: new Date() },
            quantitySold: { lt: prisma.ticketLot.fields.quantityTotal },
          },
          orderBy: {
            priceCents: 'asc',
          },
        },
      },
    });

    if (!event || event.status !== 'PUBLISHED' || event.archivedAt !== null) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
