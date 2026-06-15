import Link from "next/link";
import { Suspense } from "react";
import EventsSearch from "@/app/components/events-search";
import { CityPills } from "./city-pills";

export function HomeHero({
  cities,
  categories,
}: {
  cities: string[];
  categories: string[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="absolute inset-0 public-hero-glow pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00a0e3]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-16 sm:pb-20">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#00a0e3] mb-4">
            Bilhetes em Portugal
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.05]">
            Descobre eventos,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5ec8f8] to-[#00a0e3]">
              festas e festivais
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-xl leading-relaxed">
            Compra bilhetes oficiais com segurança. QR instantâneo, MB Way e cartão.
          </p>
        </div>

        <div className="mt-10 max-w-4xl">
          <Suspense fallback={<div className="h-20 rounded-2xl bg-white/5 animate-pulse" />}>
            <EventsSearch cities={cities} categories={categories} variant="hero" basePath="/events" />
          </Suspense>
        </div>

        {cities.length > 0 && (
          <div className="mt-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
              Cidades populares
            </p>
            <CityPills cities={cities} />
          </div>
        )}
      </div>
    </section>
  );
}
