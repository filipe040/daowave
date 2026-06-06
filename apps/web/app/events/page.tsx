import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getEvents() {
  try {
    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        archivedAt: null,
        endAt: { gte: now },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        city: true,
        venue: true,
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
    <div className="min-h-screen mesh-gradient text-neutral-900">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <div className="mb-8 sm:mb-10">
          <div className="text-[11px] uppercase tracking-wider text-violet-600 font-bold">
            Listagem de eventos
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900">
            Todos os eventos disponíveis
          </h1>
          <p className="mt-2 text-sm sm:text-[15px] text-neutral-600 max-w-2xl">
            Escolhe o evento e segue para a compra dos teus bilhetes de forma rápida e segura.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-10 sm:p-14 text-center shadow-md">
            <Calendar className="h-14 w-14 text-neutral-300 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[15px] sm:text-[16px] font-bold text-neutral-800">
              Nenhum evento disponível neste momento.
            </p>
            <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
              Volta mais tarde para descobrir novos eventos na plataforma.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-md hover:shadow-xl hover:border-violet-200 hover:-translate-y-1 transition-all duration-200 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-700">
                      <MapPin className="h-3 w-3" />
                      {event.city || "—"}
                    </span>
                    <span className="h-9 w-9 rounded-xl flex items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-500 group-hover:bg-violet-50 group-hover:border-violet-200 group-hover:text-violet-600 transition">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>

                  <h2 className="text-[18px] sm:text-[20px] font-bold text-neutral-900 leading-snug line-clamp-2">
                    {event.title}
                  </h2>

                  <div className="mt-5 space-y-3 text-[13px] text-neutral-600">
                    {event.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-violet-500 shrink-0" />
                        <span className="font-medium truncate">{event.venue}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                      <span className="font-medium">
                        {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-neutral-100 inline-flex items-center gap-2 text-[13px] font-bold text-violet-600 group-hover:translate-x-1 transition-transform">
                    Ver detalhes <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center text-[12px] text-neutral-500">
              A mostrar apenas eventos publicados e não arquivados.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
