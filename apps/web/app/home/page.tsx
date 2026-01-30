/**
 * Home Page - List of Events
 */

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { MapPin, Calendar } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-[0.18em]">
            DESTAQUES
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Eventos em destaque
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl">
            Uma seleção de eventos disponíveis para compra imediata de bilhetes.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white py-14 text-center">
            <p className="text-slate-600 text-base">
              Nenhum evento disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => {
              const minPrice = event.ticketLots[0]?.priceCents || 0;
              
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-500/70 transition-all overflow-hidden group"
                >
                  {event.coverImage && (
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <Image
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="text-lg font-semibold text-slate-900 mb-1.5 group-hover:text-blue-700 transition-colors line-clamp-2">
                      {event.title}
                    </h2>
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                        <span>{event.venue}, {event.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                        <span>{formatDate(event.startAt)}</span>
                      </div>
                    </div>
                    {minPrice > 0 && (
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <span className="text-xs text-slate-500">A partir de</span>
                        <span className="text-lg font-bold text-blue-700">
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
