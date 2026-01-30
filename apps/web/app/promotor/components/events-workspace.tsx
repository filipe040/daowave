"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Globe, Calendar, Dot, Ticket, ShoppingCart } from "lucide-react";

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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar projeto…"
            className={cn(
              "w-full rounded-2xl border border-border bg-background",
              "px-10 py-3.5 text-[13px] sm:text-[14px]",
              "text-foreground placeholder:text-muted-foreground/75",
              "outline-none transition-all duration-200",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 rounded-xl",
                "border border-border bg-secondary px-2.5 py-1.5",
                "text-[12px] font-medium text-foreground",
                "hover:bg-secondary/80 transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Grid / Empty */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 sm:p-14 text-center">
          <div className="text-muted-foreground text-[13px] sm:text-[14px]">
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
                  "border border-border bg-card",
                  "p-5 sm:p-6",
                  "transition-all duration-200",
                  "hover:border-ring/40 hover:bg-card/90",
                  "active:scale-[0.99]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              >
                {/* subtle glow */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                </div>

                {/* top row */}
                <div className="relative flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] tracking-wider uppercase text-muted-foreground truncate">
                      {event.slug}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Dot
                        className={cn(
                          "h-6 w-6 -ml-2",
                          published ? "text-[hsl(var(--success))]" : "text-[hsl(var(--warning))]"
                        )}
                      />
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {published ? "Publicado" : "Rascunho"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "h-9 w-9 rounded-2xl flex items-center justify-center",
                      "border border-border bg-secondary",
                      "text-muted-foreground group-hover:text-foreground",
                      "transition"
                    )}
                    aria-hidden="true"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>

                {/* title */}
                <h3 className="relative mt-4 text-[18px] sm:text-[20px] font-semibold text-foreground leading-snug">
                  {event.title}
                </h3>

                {/* meta */}
                <div className="relative mt-5 space-y-3 text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="uppercase tracking-wider text-muted-foreground/80">Cidade</span>
                    <span className="ml-auto font-semibold text-foreground">
                      {event.city?.toUpperCase?.() || "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="uppercase tracking-wider text-muted-foreground/80">Data</span>
                    <span className="ml-auto font-semibold text-foreground">{formatDatePT(event.startAt)}</span>
                  </div>

                  <div className="h-px bg-border my-3" />

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{event._count?.tickets ?? 0}</span>
                      <span className="text-muted-foreground/80">tickets</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{event._count?.orders ?? 0}</span>
                      <span className="text-muted-foreground/80">encomendas</span>
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