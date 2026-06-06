"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef, useCallback } from "react";

interface EventsSearchProps {
  cities?: string[];
  initialSearch?: string;
  initialCity?: string;
  /** Base path for filter navigation (default: homepage) */
  basePath?: string;
}

const fieldCls =
  "w-full bg-white border border-neutral-200 rounded-2xl shadow-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-neutral-900 placeholder:text-neutral-400";

export default function EventsSearch({
  cities = [],
  initialSearch = "",
  initialCity = "ALL PORTUGAL",
  basePath = "/",
}: EventsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch || "");
  const [city, setCity] = useState(initialCity || "ALL PORTUGAL");
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cityOptions = [...cities].sort((a, b) => a.localeCompare(b, "pt-PT"));
  const displayCityOptions =
    city &&
    city !== "ALL PORTUGAL" &&
    !cityOptions.some((c) => c.toLocaleLowerCase("pt-PT") === city.toLocaleLowerCase("pt-PT"))
      ? [...cityOptions, city].sort((a, b) => a.localeCompare(b, "pt-PT"))
      : cityOptions;

  const pushFilters = useCallback(
    (nextSearch: string, nextCity: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        const trimmed = nextSearch.trim();
        if (trimmed) params.set("search", trimmed);
        else params.delete("search");

        if (nextCity && nextCity !== "ALL PORTUGAL") params.set("city", nextCity);
        else params.delete("city");

        const qs = params.toString();
        router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
      });
    },
    [basePath, router, searchParams]
  );

  // Sincronizar com URL quando a página re-renderiza (ex.: voltar atrás)
  useEffect(() => {
    setSearch(initialSearch || searchParams.get("search") || "");
    setCity(initialCity || searchParams.get("city") || "ALL PORTUGAL");
  }, [initialSearch, initialCity, searchParams]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushFilters(value, city);
    }, 350);
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushFilters(search, value);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const chevron = (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const hasFilters = search.trim().length > 0 || (city && city !== "ALL PORTUGAL");

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative min-w-0">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Pesquisar eventos..."
            className={`${fieldCls} px-12 py-3.5 text-sm font-medium`}
          />
        </div>

        {cityOptions.length > 0 ? (
          <div className="relative bg-white border border-neutral-200 rounded-2xl shadow-sm min-w-0 sm:min-w-[180px]">
            <div className="absolute left-4 top-2 text-[10px] text-neutral-400 uppercase tracking-wider pointer-events-none font-semibold">
              Cidade
            </div>
            <select
              value={city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full bg-transparent border-0 rounded-2xl px-4 pt-6 pb-3 text-neutral-900 focus:outline-none appearance-none cursor-pointer pr-10 text-sm font-semibold"
            >
              <option value="ALL PORTUGAL">Todo Portugal</option>
              {displayCityOptions.map((cityName) => (
                <option key={cityName} value={cityName}>
                  {cityName}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
              {chevron}
            </div>
          </div>
        ) : null}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {search.trim() && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              Pesquisa: {search.trim()}
            </span>
          )}
          {city && city !== "ALL PORTUGAL" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              Cidade: {city}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCity("ALL PORTUGAL");
              if (debounceRef.current) clearTimeout(debounceRef.current);
              pushFilters("", "ALL PORTUGAL");
            }}
            className="text-xs font-bold text-neutral-500 hover:text-violet-700 transition-colors px-2 py-1"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
