"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventCard, type PublicEventCardData } from "./event-card";
import { SectionHeader } from "./section-header";
import Link from "next/link";

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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener("scroll", updateScrollState);
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (events.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <SectionHeader title={title} subtitle={subtitle} href={href} linkLabel={linkLabel} />
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`h-10 w-10 rounded-full border flex items-center justify-center text-white transition-all ${
                canScrollLeft
                  ? "border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25"
                  : "border-white/5 bg-white/[0.02] text-white/20 cursor-default"
              }`}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className={`h-10 w-10 rounded-full border flex items-center justify-center text-white transition-all ${
                canScrollRight
                  ? "border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/25"
                  : "border-white/5 bg-white/[0.02] text-white/20 cursor-default"
              }`}
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
          <div className="mt-5 sm:hidden">
            <Link href={href} className="text-sm font-bold text-[#5ec8f8] hover:text-[#00a0e3] transition-colors">
              {linkLabel} →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
