"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventCard, type PublicEventCardData } from "./event-card";
import { SectionHeader } from "./section-header";

export function EventCarousel({
  title,
  subtitle,
  events,
  href,
  linkLabel = "Ver todos",
}: {
  title: string;
  subtitle?: string;
  events: PublicEventCardData[];
  href?: string;
  linkLabel?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.85;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (events.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <SectionHeader title={title} subtitle={subtitle} />
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              aria-label="Seguinte"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} variant="featured" />
          ))}
        </div>

        {href && (
          <div className="mt-4 sm:hidden">
            <a href={href} className="text-sm font-semibold text-[#5ec8f8] hover:text-[#00a0e3]">
              {linkLabel} →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
