"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

interface EventsSearchProps {
  cities: string[];
  initialSearch?: string;
  initialCity?: string;
}

export default function EventsSearch({ cities, initialSearch = "", initialCity = "ALL PORTUGAL" }: EventsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch || searchParams.get("search") || "");
  const [city, setCity] = useState(initialCity || searchParams.get("city") || "ALL PORTUGAL");
  const [category, setCategory] = useState("ALL STYLES");
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    setSearch(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      router.push(`/?${params.toString()}`);
    });
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL PORTUGAL") {
        params.set("city", value);
      } else {
        params.delete("city");
      }
      router.push(`/?${params.toString()}`);
    });
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    // Category filtering not implemented yet
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-5">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-zinc-400">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="SEARCH EVENTS..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-10 sm:px-12 py-3 sm:py-4 text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500/50 transition-colors uppercase text-xs sm:text-sm md:text-base"
        />
      </div>

      {/* City Filter */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg min-w-[140px] sm:min-w-[160px]">
        <div className="absolute left-3 sm:left-4 top-1.5 sm:top-2 text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider pointer-events-none">
          CITY
        </div>
        <select
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          className="w-full bg-transparent border-0 rounded-lg px-3 sm:px-4 pt-5 sm:pt-6 pb-3 sm:pb-4 text-white focus:outline-none focus:ring-0 appearance-none cursor-pointer pr-8 sm:pr-10 uppercase text-xs sm:text-sm md:text-base font-bold"
        >
          <option value="ALL PORTUGAL" className="bg-zinc-900">ALL PORTUGAL</option>
          {cities.map((cityName) => (
            <option key={cityName} value={cityName} className="bg-zinc-900">
              {cityName.toUpperCase()}
            </option>
          ))}
        </select>
        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-zinc-400">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Category Filter */}
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg min-w-[140px] sm:min-w-[160px]">
        <div className="absolute left-3 sm:left-4 top-1.5 sm:top-2 text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider pointer-events-none">
          CATEGORY
        </div>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full bg-transparent border-0 rounded-lg px-3 sm:px-4 pt-5 sm:pt-6 pb-3 sm:pb-4 text-white focus:outline-none focus:ring-0 appearance-none cursor-pointer pr-8 sm:pr-10 uppercase text-xs sm:text-sm md:text-base font-bold"
        >
          <option value="ALL STYLES" className="bg-zinc-900">ALL STYLES</option>
          {/* Add categories when category field is added to Event model */}
        </select>
        <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-zinc-400">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
