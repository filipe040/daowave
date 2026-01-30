import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { prisma } from "@/lib/prisma";

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
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="text-[11px] uppercase tracking-wider text-white/45">
            Listagem de eventos
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-semibold text-white/90">
            Todos os eventos disponíveis
          </h1>
          <p className="mt-2 text-sm sm:text-[14px] text-white/60 max-w-2xl">
            Escolhe o evento e segue para a compra dos teus bilhetes de forma rápida e segura.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-10 sm:p-14 text-center shadow-[0_18px_60px_rgba(0,0,0,.45)]">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl border border-white/10 bg-white/5" />
            <p className="text-[15px] sm:text-[16px] font-semibold text-white/85">
              Nenhum evento disponível neste momento.
            </p>
            <p className="mt-2 text-sm text-white/60 max-w-md mx-auto">
              Volta mais tarde para descobrir novos eventos na plataforma.
            </p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className={[
                    "group relative overflow-hidden rounded-3xl",
                    "border border-white/10 bg-white/5 backdrop-blur-2xl",
                    "p-5 sm:p-6",
                    "shadow-[0_18px_60px_rgba(0,0,0,.45)]",
                    "transition-all duration-200",
                    "hover:bg-white/6 hover:border-white/16 active:scale-[0.99]",
                  ].join(" ")}
                >
                  {/* subtle hover highlight */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/6 blur-3xl" />
                  </div>

                  {/* Top meta */}
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wider text-white/45 truncate">
                        {event.city || "—"}
                      </div>
                    </div>

                    <span
                      className={[
                        "h-9 w-9 rounded-2xl flex items-center justify-center",
                        "border border-white/10 bg-white/5",
                        "text-white/65 group-hover:text-white transition",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="relative mt-4 text-[18px] sm:text-[20px] font-semibold text-white/92 leading-snug line-clamp-2">
                    {event.title}
                  </h2>

                  {/* Info rows */}
                  <div className="relative mt-5 space-y-3 text-[12px] text-white/60">
                    <div className="flex items-center justify-between gap-3">
                      <span className="uppercase tracking-wider text-white/40">Cidade</span>
                      <span className="font-medium text-white/75 truncate">
                        {event.city?.toUpperCase?.() || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="uppercase tracking-wider text-white/40">Data</span>
                      <span className="font-medium text-white/75">
                        {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                      </span>
                    </div>

                    <div className="h-px bg-white/10 my-3" />

                    {/* CTA */}
                    <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-white/75 group-hover:text-white transition">
                      Ver detalhes
                      <span className="text-white/60 group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Footer hint (optional) */}
            <div className="mt-8 text-center text-[12px] text-white/45">
              A mostrar apenas eventos publicados e não arquivados.
            </div>
          </>
        )}
      </div>
    </div>
  );
}