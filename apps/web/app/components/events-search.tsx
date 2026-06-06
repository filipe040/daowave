"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CITIES_PT } from "@/app/constants/cities";

interface EventsSearchProps {
  cities?: string[];
  initialSearch?: string;
  initialCity?: string;
}

const fieldCls =
  "w-full bg-white border border-neutral-200 rounded-2xl shadow-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-neutral-900 placeholder:text-neutral-400";

export default function EventsSearch({ cities = [], initialSearch = "", initialCity = "ALL PORTUGAL" }: EventsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch || searchParams.get("search") || "");
  const [city, setCity] = useState(initialCity || searchParams.get("city") || "ALL PORTUGAL");
  const [category, setCategory] = useState("ALL STYLES");
  const [, startTransition] = useTransition();

  const cityOptions = (cities && cities.length > 0) ? cities : [...CITIES_PT].sort((a, b) => a.localeCompare(b, "pt-PT"));

  const handleSearch = (value: string) => {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("search", value);
      else params.delete("search");
      router.push(`/?${params.toString()}`);
    });
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL PORTUGAL") params.set("city", value);
      else params.delete("city");
      router.push(`/?${params.toString()}`);
    });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  const chevron = (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <div className="flex-1 relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Pesquisar eventos..."
          className={`${fieldCls} px-12 py-3.5 text-sm font-medium`}
        />
      </div>

      <div className="relative bg-white border border-neutral-200 rounded-2xl shadow-sm min-w-[160px]">
        <div className="absolute left-4 top-2 text-[10px] text-neutral-400 uppercase tracking-wider pointer-events-none font-semibold">
          Cidade
        </div>
        <select
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          className="w-full bg-transparent border-0 rounded-2xl px-4 pt-6 pb-3 text-neutral-900 focus:outline-none appearance-none cursor-pointer pr-10 text-sm font-semibold"
        >
          <option value="ALL PORTUGAL">Todo Portugal</option>
          {cityOptions.map((cityName) => (
            <option key={cityName} value={cityName}>{cityName}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">{chevron}</div>
      </div>

      <div className="relative bg-white border border-neutral-200 rounded-2xl shadow-sm min-w-[160px]">
        <div className="absolute left-4 top-2 text-[10px] text-neutral-400 uppercase tracking-wider pointer-events-none font-semibold">
          Categoria
        </div>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full bg-transparent border-0 rounded-2xl px-4 pt-6 pb-3 text-neutral-900 focus:outline-none appearance-none cursor-pointer pr-10 text-sm font-semibold"
        >
          <option value="ALL STYLES">Todos os estilos</option>
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">{chevron}</div>
      </div>
    </div>
  );
}
