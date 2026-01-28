/**
 * Event Detail Page
 */

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
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
      // Branding
      primaryColor: true,
      secondaryColor: true,
      logoUrl: true,
      bannerUrl: true,
      fontFamily: true,
      // Landing Page
      landingPageContent: true,
      useCustomLandingPage: true,
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
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event || event.status !== 'PUBLISHED') {
    notFound();
  }

  // Se landing page customizada está ativa e tem conteúdo, renderizar HTML customizado
  if (event.useCustomLandingPage && event.landingPageContent) {
    const customHtml = event.landingPageContent
      .replace(/\{eventTitle\}/g, event.title)
      .replace(/\{eventDescription\}/g, event.description)
      .replace(/\{eventDate\}/g, formatDate(event.startAt))
      .replace(/\{venue\}/g, event.venue)
      .replace(/\{city\}/g, event.city);
    
    return (
      <div 
        className="min-h-screen"
        style={{
          fontFamily: event.fontFamily || undefined,
        } as React.CSSProperties}
        dangerouslySetInnerHTML={{ __html: customHtml }}
      />
    );
  }

  // Landing page padrão com branding aplicado
  const primaryColor = event.primaryColor || '#6C2BD9';
  const secondaryColor = event.secondaryColor || '#06B6D4';
  const fontFamily = event.fontFamily || undefined;

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      style={{ fontFamily }}
    >
      <style jsx>{`
        :root {
          --event-primary: ${primaryColor};
          --event-secondary: ${secondaryColor};
        }
        .event-primary { color: ${primaryColor}; }
        .event-secondary { color: ${secondaryColor}; }
        .bg-event-primary { background-color: ${primaryColor}; }
        .bg-event-secondary { background-color: ${secondaryColor}; }
        .border-event-primary { border-color: ${primaryColor}; }
      `}</style>
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Banner customizado ou cover image */}
          {event.bannerUrl ? (
            <div className="relative h-96 w-full">
              <img
                src={event.bannerUrl}
                alt={event.title}
                className="w-full h-full object-cover"
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
            {/* Logo se disponível */}
            {event.logoUrl && (
              <div className="mb-4">
                <img src={event.logoUrl} alt={`${event.title} logo`} className="h-16 w-auto object-contain" />
              </div>
            )}
            
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
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-semibold">Local</p>
                      <p>{event.venue}</p>
                      <p className="text-sm">{event.city}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📅</span>
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
