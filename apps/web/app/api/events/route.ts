/**
 * GET /api/events
 * List published events
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildPublicEventsWhere } from '@/lib/events/public-event-filters';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const where = buildPublicEventsWhere({
      city: city ?? undefined,
      search: search ?? undefined,
      category: category ?? undefined,
    });

    const events = await prisma.event.findMany({
      where,
      include: {
        ticketLots: {
          where: {
            saleStartAt: { lte: new Date() },
            saleEndAt: { gte: new Date() },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: {
        startAt: 'asc',
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
