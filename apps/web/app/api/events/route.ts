/**
 * GET /api/events
 * List published events
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cityMatchValues } from '@/lib/events/public-event-cities';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const search = searchParams.get('search');

    const where: any = {
      status: 'PUBLISHED',
      archivedAt: null, // Only show non-archived events
      endAt: { gte: new Date() },
    };

    if (city) {
      where.city = { in: cityMatchValues(city) };
    }

    if (search) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { title: { contains: search } },
            { description: { contains: search } },
            { city: { contains: search } },
          ],
        },
      ];
    }

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
