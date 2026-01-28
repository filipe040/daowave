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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="mb-8 md:mb-10 flex flex-col gap-2">
          <p className="text-xs font-medium text-blue-700 uppercase tracking-[0.18em]">
            LISTAGEM DE EVENTOS
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900">
            Todos os eventos disponíveis
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
            Escolhe o evento e segue para a compra dos teus bilhetes de forma rápida e segura.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 md:p-16 text-center">
            <div className="mx-auto mb-4 text-5xl">📅</div>
            <p className="text-lg md:text-xl font-semibold text-slate-800 mb-2">
              Nenhum evento disponível neste momento.
            </p>
            <p className="text-sm md:text-base text-slate-600 max-w-md mx-auto">
              Volta mais tarde para descobrir novos eventos na plataforma.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {events.map((event: any) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-500/70 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <h2 className="text-lg md:text-xl font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug">
                    {event.title}
                  </h2>
                  <div className="space-y-2 text-sm md:text-base">
                    <div className="flex items-start gap-2 text-slate-600">
                      <span className="text-base mt-0.5">📍</span>
                      <span className="line-clamp-1">{event.city}</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600">
                      <span className="text-base mt-0.5">🕐</span>
                      <span className="line-clamp-2">
                        {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center text-sm font-semibold text-blue-700 group-hover:text-blue-800 transition-colors">
                  Ver detalhes
                  <span className="ml-1.5 text-base">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
