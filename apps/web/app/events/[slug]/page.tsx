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
      organization: {
        select: {
          name: true,
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
    organizer: event.organization
      ? { "@type": "Organization", name: event.organization.name }
      : event.promoter
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
      className="min-h-screen bg-black text-white"
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

      {/* Background illumination */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute bottom-[10%] -left-[10%] h-[400px] w-[400px] rounded-full blur-[100px] opacity-10"
          style={{ backgroundColor: secondaryColor }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-20">
        <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          {/* Banner customizado ou cover image */}
          {event.bannerUrl ? (
            <div className="relative h-64 sm:h-96 w-full group">
              <Image
                src={event.bannerUrl}
                alt={event.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                unoptimized
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          ) : event.coverImage ? (
            <div className="relative h-64 sm:h-96 w-full group">
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-br from-white/10 to-white/5" />
          )}

          <div className="p-6 sm:p-10 md:p-16">
            <div className="flex flex-col gap-8 md:grid md:grid-cols-[1fr_380px]">
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest mb-6"
                  style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10`, color: primaryColor }}
                >
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                  Evento de {(event as any).organization?.name || event.promoter?.brandName || 'Organização'}
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 text-white tracking-tight leading-[1.1]">
                  {event.title}
                </h1>

                <div className="space-y-10 mb-12">
                  <section>
                    <h2 className="text-[12px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Sobre o Evento</h2>
                    <p className="text-white/85 text-[16px] sm:text-[17px] leading-[1.7] whitespace-pre-line">
                      {event.description}
                    </p>
                  </section>

                  <section className="grid sm:grid-cols-2 gap-8 pt-6 border-t border-white/10">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-white/90" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Localização</p>
                        <p className="text-white font-semibold text-[15px]">{event.venue}</p>
                        <p className="text-[14px] text-white/70">{event.city}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                        <Calendar className="h-5 w-5 text-white/90" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-white/50 uppercase tracking-widest mb-1.5">Data e Hora</p>
                        <p className="text-white font-semibold text-[15px]">{formatDate(event.startAt)}</p>
                        {event.endAt && (
                          <p className="text-[14px] text-white/70">até {formatDate(event.endAt)}</p>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <aside className="relative">
                <div className="sticky top-24">
                  <TicketSelector event={event as any} ticketLots={event.ticketLots as any} />

                  {/* Trust Footer */}
                  <div className="mt-6 text-center">
                    <p className="text-[11px] text-white/30 flex items-center justify-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-emerald-500" />
                      Pagamento seguro via MB WAY / Cartão
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
