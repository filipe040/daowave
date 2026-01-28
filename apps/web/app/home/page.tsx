/**
 * Home Page - List of Events
 */

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getEvents() {
  return await prisma.event.findMany({
    where: {
      status: 'PUBLISHED',
      archivedAt: null, // Only show non-archived events
      endAt: { gte: new Date() },
    },
    include: {
      ticketLots: {
        where: {
          saleStartAt: { lte: new Date() },
          saleEndAt: { gte: new Date() },
        },
        orderBy: {
          priceCents: 'asc',
        },
        take: 1,
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
    take: 12,
  });
}

export default async function HomePage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Eventos Disponíveis
          </h1>
          <p className="text-slate-600">
            Descubra os melhores eventos e adquira os seus bilhetes
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">
              Nenhum evento disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const minPrice = event.ticketLots[0]?.priceCents || 0;
              
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
                >
                  {event.coverImage && (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {event.title}
                    </h2>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="space-y-2 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-2">
                        <span>📍</span>
                        <span>{event.venue}, {event.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>{formatDate(event.startAt)}</span>
                      </div>
                    </div>
                    {minPrice > 0 && (
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <span className="text-sm text-slate-500">A partir de</span>
                        <span className="text-xl font-bold text-blue-600">
                          {formatCurrency(minPrice)}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
