/**
 * Event Detail Page
 */

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import { TicketSelector } from './ticket-selector';

export const dynamic = 'force-dynamic';

async function getEvent(slug: string) {
  return await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      venue: true,
      city: true,
      startAt: true,
      endAt: true,
      coverImage: true,
      status: true,
      archivedAt: true,
      // Branding
      primaryColor: true,
      secondaryColor: true,
      bannerUrl: true,
      // Landing Page fields removed (legacy)
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
        select: {
          id: true,
          name: true,
          priceCents: true,
          currency: true,
          quantityTotal: true,
          quantitySold: true,
        },
      },
    },
  });
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event || event.status !== 'PUBLISHED' || (event as any).archivedAt !== null) {
    notFound();
  }

  // Landing page padrão com branding aplicado
  const primaryColor = event.primaryColor || '#6C2BD9';
  const secondaryColor = event.secondaryColor || '#06B6D4';

  // JSON-LD Schema.org Event structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startAt.toISOString(),
    endDate: event.endAt.toISOString(),
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city,
        addressCountry: "PT",
      },
    },
    image: event.coverImage || event.bannerUrl || undefined,
    organizer: event.promoter
      ? { "@type": "Organization", name: event.promoter.brandName }
      : undefined,
    offers:
      event.ticketLots.length > 0
        ? event.ticketLots.map((lot) => ({
          "@type": "Offer",
          name: lot.name,
          price: (lot.priceCents / 100).toFixed(2),
          priceCurrency: lot.currency,
          availability:
            lot.quantitySold < lot.quantityTotal
              ? "https://schema.org/InStock"
              : "https://schema.org/SoldOut",
          url: `https://tickets.daowave.pt/events/${event.slug}`,
        }))
        : undefined,
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --event-primary: ${primaryColor};
          --event-secondary: ${secondaryColor};
        }
        .event-primary { color: ${primaryColor}; }
        .event-secondary { color: ${secondaryColor}; }
        .bg-event-primary { background-color: ${primaryColor}; }
        .bg-event-secondary { background-color: ${secondaryColor}; }
        .border-event-primary { border-color: ${primaryColor}; }
      ` }} />
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Banner customizado ou cover image */}
          {event.bannerUrl ? (
            <div className="relative h-96 w-full">
              <Image
                src={event.bannerUrl}
                alt={event.title}
                fill
                className="object-cover"
                unoptimized
                sizes="100vw"
              />
            </div>
          ) : event.coverImage ? (
            <div className="relative h-96 w-full">
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="p-8">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ color: primaryColor }}
            >
              {event.title}
            </h1>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Sobre o Evento
                </h2>
                <p className="text-slate-600 whitespace-pre-line mb-6">
                  {event.description}
                </p>

                <div className="space-y-3 text-slate-600">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-slate-500" strokeWidth={1.5} />
                    <div>
                      <p className="font-semibold">Local</p>
                      <p>{event.venue}</p>
                      <p className="text-sm">{event.city}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-6 w-6 shrink-0 text-slate-500" strokeWidth={1.5} />
                    <div>
                      <p className="font-semibold">Data e Hora</p>
                      <p>{formatDate(event.startAt)}</p>
                      {event.endAt && (
                        <p className="text-sm">até {formatDate(event.endAt)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <TicketSelector event={event} ticketLots={event.ticketLots} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
