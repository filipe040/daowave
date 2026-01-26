/**
 * POST /api/promotor/events
 * Create new event
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { eventSchema } from '@/lib/security/validation';
import { generateSlug } from '@/lib/utils';

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

    const body = await request.json();
    const validated = eventSchema.parse(body);

    // Get promoter profile
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!promoter) {
      return NextResponse.json(
        { error: 'Promoter profile not found' },
        { status: 404 }
      );
    }

    // Use provided slug or generate from title
    const slug = (body.slug && typeof body.slug === 'string' && body.slug.trim()) 
      ? generateSlug(body.slug)
      : generateSlug(validated.title);

    // Check if slug exists
    const existing = await prisma.event.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Event with this slug already exists' },
        { status: 400 }
      );
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        promoterId: promoter.id,
        title: validated.title,
        slug,
        description: validated.description,
        venue: validated.venue,
        city: validated.city,
        startAt: new Date(validated.startAt),
        endAt: new Date(validated.endAt),
        coverImage: validated.coverImage || null,
        status: 'DRAFT',
      },
    });

    return NextResponse.json(event);
  } catch (error: any) {
    console.error('Error creating event:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
