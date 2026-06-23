import Link from "next/link";
import { Suspense } from "react";
import EventsSearch from "@/app/components/events-search";
import { CityPills } from "./city-pills";

const CATEGORY_PILLS = [
  { label: "Festivais", icon: "🎪", href: "/events?category=festival" },
  { label: "Concertos", icon: "🎸", href: "/events?category=concerto" },
  { label: "Teatro", icon: "🎭", href: "/events?category=teatro" },
  { label: "Desporto", icon: "⚽", href: "/events?category=desporto" },
  { label: "Arte & Cultura", icon: "🎨", href: "/events?category=arte" },
];

export function HomeHero({
  cities,
  categories,
}: {
  cities: string[];
  categories: string[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] noise-overlay">
      {/* Layered gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#00a0e3]/12 blur-[140px] rounded-full" />
        <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-indigo-500/6 blur-[120px] rounded-full" />
        <div className="absolute top-10 right-0 w-[350px] h-[350px] bg-[#00a0e3]/8 blur-[100px] rounded-full" />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-20 sm:pb-24">
        {/* Live badge */}
        <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[#00a0e3]/30 bg-[#00a0e3]/10 px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00a0e3] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00a0e3]" />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5ec8f8]">
            Eventos em Portugal
          </span>
        </div>

        <div className="max-w-3xl">
          <h1 className="animate-fade-up-delay-1 text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.0] mb-0">
            Descobre
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(135deg, #5ec8f8 0%, #00a0e3 40%, #818cf8 100%)",
              }}
            >
              os melhores
            </span>
            <br />
            eventos
          </h1>
          <p className="animate-fade-up-delay-2 mt-5 text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
            Bilhetes oficiais com segurança. QR instantâneo, MB Way e cartão.
          </p>
        </div>

        {/* Search */}
        <div className="animate-fade-up-delay-2 mt-10 max-w-4xl">
          <Suspense fallback={<div className="h-20 rounded-2xl bg-white/5 animate-pulse" />}>
            <EventsSearch cities={cities} categories={categories} variant="hero" basePath="/events" />
          </Suspense>
        </div>

        {/* Category quick filters */}
        <div className="animate-fade-up-delay-3 mt-6 flex flex-wrap gap-2.5">
          {CATEGORY_PILLS.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.05] px-5 py-2.5 text-sm font-bold text-zinc-300 transition-all hover:border-[#00a0e3]/50 hover:bg-[#00a0e3]/12 hover:text-white hover:scale-[1.04] active:scale-95"
            >
              <span className="text-base leading-none">{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Cities */}
        {cities.length > 0 && (
          <div className="animate-fade-up-delay-3 mt-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3">
              Cidades populares
            </p>
            <CityPills cities={cities} />
          </div>
        )}
      </div>
    </section>
  );
}
