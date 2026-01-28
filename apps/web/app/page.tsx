import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import EventsSearch from "./components/events-search";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents(searchParams: { search?: string; city?: string; category?: string }) {
  const where: any = {
    status: "PUBLISHED",
    endAt: { gte: new Date() },
  };

  if (searchParams.search) {
    where.OR = [
      { title: { contains: searchParams.search } },
      { description: { contains: searchParams.search } },
      { city: { contains: searchParams.search } },
    ];
  }

  if (searchParams.city && searchParams.city !== "ALL PORTUGAL") {
    where.city = { contains: searchParams.city };
  }

  // Note: Category filtering would require a category field in the Event model
  // For now, we'll skip category filtering

  return await prisma.event.findMany({
    where,
    include: {
      promoter: {
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          tickets: true,
        },
      },
    },
    orderBy: {
      startAt: "asc",
    },
    take: 50,
  }).catch(() => []);
}

async function getCities() {
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      endAt: { gte: new Date() },
    },
    select: {
      city: true,
    },
    distinct: ["city"],
  }).catch(() => []);

  return events.map((e) => e.city).filter(Boolean).sort();
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; city?: string; category?: string }>;
}) {
  const params = await searchParams;
  const events = await getEvents(params);
  const cities = await getCities();

  return (
    <div className="min-h-screen">
      {/* Hero Section - 5ive Tickets Style */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10">
          {/* Main Heading */}
          <div className="space-y-1 sm:space-y-2 md:space-y-3">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white uppercase tracking-tight">
              THE BEST
            </h1>
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold uppercase tracking-tight">
              <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                EXPERIENCES
              </span>
            </h2>
            <h3 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white uppercase tracking-tight">
              NEAR YOU
            </h3>
          </div>

          {/* Tagline */}
          <p className="text-xs sm:text-sm md:text-base text-white uppercase tracking-wide max-w-xl mx-auto px-4">
            5IVE IS THE PREMIUM PLATFORM FOR THOSE WHO LIVE FOR THE NIGHT
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Link
              href="/events"
              className="bg-white text-black px-6 py-3 sm:px-8 sm:py-4 rounded-lg font-bold text-xs sm:text-sm uppercase tracking-wide hover:bg-zinc-100 transition-colors w-full sm:w-auto text-center"
            >
              EXPLORE EVENTS
            </Link>
            <Link
              href="/promotor/login"
              className="text-white underline decoration-2 underline-offset-4 font-semibold text-xs sm:text-sm uppercase tracking-wide hover:opacity-80 transition-opacity"
            >
              SELL TICKETS
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[10px] sm:text-xs text-white uppercase tracking-wider opacity-70">SCROLL TO EXPLORE</span>
          <div className="w-px h-8 sm:h-12 bg-white/50 relative overflow-hidden">
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* UPCOMING EVENTS Section - 5ive Tickets Style */}
      <section className="bg-black py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* DISCOVER MORE with pink line */}
          <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 md:mb-10">
            <div className="w-8 sm:w-10 md:w-12 h-px bg-pink-500"></div>
            <span className="text-[10px] sm:text-xs md:text-sm text-white uppercase tracking-wider">
              DISCOVER MORE
            </span>
          </div>

          {/* UPCOMING EVENTS Heading */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-10">
            <div className="flex flex-col">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white uppercase tracking-tight leading-none">
                UPCOMING
              </h1>
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-600 uppercase tracking-tight leading-none">
                EVENTS
              </h2>
            </div>
            <Link
              href="/events"
              className="text-white hover:text-zinc-300 transition-colors font-semibold text-xs sm:text-sm md:text-base whitespace-nowrap flex items-center gap-1 sm:gap-2 group uppercase tracking-wide self-start sm:self-end"
            >
              VIEW ALL EVENTS
              <span className="group-hover:translate-x-1 transition-transform text-sm sm:text-base">→</span>
            </Link>
          </div>

          {/* Search and Filters */}
          <Suspense fallback={<div className="h-16 bg-zinc-900 rounded-lg animate-pulse"></div>}>
            <EventsSearch cities={cities} initialSearch={params.search} initialCity={params.city} />
          </Suspense>

          {/* Events List or Empty State */}
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 text-center mt-8 sm:mt-10">
              <div className="mb-4 sm:mb-6 text-5xl sm:text-6xl md:text-7xl opacity-50">📅</div>
              <p className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 sm:mb-3 uppercase">
                Sem eventos disponíveis
              </p>
              <p className="text-xs sm:text-sm md:text-base text-zinc-400 max-w-md mx-auto px-4">
                De momento não existem eventos publicados. Volta mais tarde para descobrir os próximos eventos!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mt-8 sm:mt-10">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group bg-zinc-900 rounded-lg sm:rounded-xl overflow-hidden border border-zinc-800 hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/20 hover:-translate-y-1"
                >
                  {event.coverImage && (
                    <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                    </div>
                  )}
                  <div className="p-4 sm:p-5 md:p-6">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 group-hover:text-pink-400 transition-colors line-clamp-2 leading-tight text-white uppercase">
                      {event.title}
                    </h3>
                    <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm md:text-base text-zinc-400 mb-4 sm:mb-5 md:mb-6">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="mt-0.5 text-sm sm:text-base">📍</span>
                        <span className="line-clamp-1">{event.venue}, {event.city}</span>
                      </div>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="mt-0.5 text-sm sm:text-base">📅</span>
                        <span className="line-clamp-2">
                          {new Date(event.startAt).toLocaleDateString("pt-PT", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-zinc-800 gap-2">
                      <div className="text-xs sm:text-sm md:text-base text-zinc-500 truncate uppercase">
                        {event.promoter?.brandName || "Promoter"}
                      </div>
                      <span className="text-pink-400 font-semibold group-hover:text-pink-300 transition text-xs sm:text-sm md:text-base whitespace-nowrap flex items-center gap-1 uppercase">
                        View Details
                        <span className="group-hover:translate-x-1 transition-transform text-sm sm:text-base">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Event Promoter CTA Section - 5ive Tickets Style */}
      <section className="bg-zinc-900 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10">
            {/* Main Heading */}
            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white uppercase tracking-tight">
                ARE YOU AN
              </h2>
              <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight">
                <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  EVENT PROMOTER!
                </span>
              </h3>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-base text-white uppercase tracking-wide max-w-2xl mx-auto px-4">
              JOIN 5IVE TICKETS AND START SELLING TICKETS. FAST, RELIABLE, AND SOCIAL.
            </p>

            {/* CTA Button */}
            <div className="pt-2 sm:pt-4">
              <Link
                href="/promotor/login"
                className="inline-block bg-white text-black px-6 py-3 sm:px-8 sm:py-4 md:px-10 md:py-5 rounded-lg font-bold text-xs sm:text-sm md:text-base uppercase tracking-wide hover:bg-zinc-100 transition-colors"
              >
                GET STARTED NOW
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
