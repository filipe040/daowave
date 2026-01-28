import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents() {
  try {
    // Direct database call instead of fetch (more efficient and avoids HTTP/HTTPS issues)
    const now = new Date();
    const events = await prisma.event.findMany({
      where: { 
        status: "PUBLISHED",
        archivedAt: null, // Only show non-archived events
        // Show events that haven't ended yet (endAt >= today)
        endAt: { 
          gte: now, // Event hasn't ended yet
        },
      },
      orderBy: { startAt: "asc" },
      select: { 
        id: true, 
        title: true, 
        slug: true,
        city: true,
        startAt: true,
        endAt: true,
      },
    });
    return events;
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      <div className="mb-8 md:mb-12 space-y-3">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
          Eventos
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl">
          Descubra os próximos eventos e garanta o seu lugar
        </p>
      </div>

      {events.length === 0 ? (
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-12 md:p-16 lg:p-20 text-center shadow-lg">
          <div className="mx-auto mb-6 text-6xl md:text-7xl opacity-50">📅</div>
          <p className="text-xl md:text-2xl font-semibold text-zinc-300 mb-3">Nenhum evento disponível</p>
          <p className="text-base md:text-lg text-zinc-500 max-w-md mx-auto">
            Novos eventos serão adicionados em breve. Volte mais tarde para descobrir os próximos eventos!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {events.map((event: any, index: number) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-800/60 backdrop-blur-sm p-6 md:p-8 transition-all duration-300 hover:border-purple-500/50 hover:bg-zinc-800/80 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative z-10 space-y-4">
                <h2 className="text-xl md:text-2xl font-bold group-hover:text-purple-400 transition-colors line-clamp-2 leading-tight">
                  {event.title}
                </h2>
                <div className="space-y-3 text-sm md:text-base">
                  <div className="flex items-start gap-3 text-zinc-400">
                    <span className="text-lg mt-0.5">📍</span>
                    <span className="line-clamp-1">{event.city}</span>
                  </div>
                  <div className="flex items-start gap-3 text-zinc-400">
                    <span className="text-lg mt-0.5">🕐</span>
                    <span className="line-clamp-2">{format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-700/50 flex items-center text-sm md:text-base font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
                  Ver detalhes
                  <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
