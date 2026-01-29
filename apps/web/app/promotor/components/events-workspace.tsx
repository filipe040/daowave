"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Globe,
  Calendar,
  Dot,
  Ticket,
  ShoppingCart,
} from "lucide-react";

interface Event {
  id: string;
  slug: string;
  title: string;
  status: string;
  city: string;
  startAt: Date | string;
  _count: {
    tickets: number;
    orders: number;
  };
}

interface EventsWorkspaceProps {
  events: Event[];
}

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function formatDatePT(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

export default function EventsWorkspace({ events }: EventsWorkspaceProps) {
  const [search, setSearch] = useState("");

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => e.title.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q));
  }, [events, search]);

  return (
    <div className="space-y-7 sm:space-y-8">
      {/* Search */}
      <div className="mx-auto w-full max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar projeto…"
            className={cn(
              "w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
              "px-10 py-3.5 text-[13px] sm:text-[14px]",
              "text-white/90 placeholder:text-white/35",
              "outline-none transition-all duration-200",
              "focus:border-white/18 focus:bg-white/7"
            )}
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-[12px] text-white/70 hover:text-white hover:bg-white/8 transition"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Grid / Empty */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 sm:p-14 text-center">
          <div className="text-white/55 text-[13px] sm:text-[14px]">
            {search ? "Nenhum projeto encontrado." : "Ainda não tens projetos."}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredEvents.map((event) => {
            const published = event.status === "PUBLISHED";

            return (
              <Link
                key={event.id}
                href={`/promotor/events/${event.id}`}
                className={cn(
                  "group relative overflow-hidden rounded-3xl",
                  "border border-white/10 bg-white/4 backdrop-blur-2xl",
                  "p-5 sm:p-6",
                  "transition-all duration-200",
                  "hover:bg-white/6 hover:border-white/16",
                  "active:scale-[0.99]"
                )}
              >
                {/* subtle highlight */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/6 blur-3xl" />
                </div>

                {/* top row */}
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] tracking-wider uppercase text-white/45 truncate">
                      {event.slug}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Dot className={cn("h-6 w-6 -ml-2", published ? "text-emerald-400/70" : "text-amber-300/70")} />
                      <span className="text-[11px] uppercase tracking-wider text-white/55">
                        {published ? "Publicado" : "Rascunho"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "h-9 w-9 rounded-2xl flex items-center justify-center",
                      "border border-white/10 bg-white/5",
                      "text-white/60 group-hover:text-white",
                      "transition"
                    )}
                    aria-hidden="true"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>

                {/* title */}
                <h3 className="relative mt-4 text-[18px] sm:text-[20px] font-semibold text-white/92 leading-snug">
                  {event.title}
                </h3>

                {/* meta */}
                <div className="relative mt-5 space-y-3 text-[12px] text-white/55">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-white/40" />
                    <span className="uppercase tracking-wider text-white/40">Cidade</span>
                    <span className="ml-auto font-medium text-white/70">{event.city?.toUpperCase?.() || "—"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-white/40" />
                    <span className="uppercase tracking-wider text-white/40">Data</span>
                    <span className="ml-auto font-medium text-white/70">{formatDatePT(event.startAt)}</span>
                  </div>

                  <div className="h-px bg-white/10 my-3" />

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-white/40" />
                      <span className="text-white/60">{event._count?.tickets ?? 0}</span>
                      <span className="text-white/40">tickets</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-white/40" />
                      <span className="text-white/60">{event._count?.orders ?? 0}</span>
                      <span className="text-white/40">encomendas</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}