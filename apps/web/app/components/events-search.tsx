"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Music2 } from "lucide-react";

interface EventsSearchProps {
  cities?: string[];
  categories?: string[];
  initialSearch?: string;
  initialCity?: string;
  initialCategory?: string;
  basePath?: string;
  variant?: "hero" | "inline";
}

function FilterSelect({
  label,
  icon: Icon,
  value,
  onChange,
  children,
}: {
  label: string;
  icon: typeof MapPin;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex-1 min-w-[140px] border-l border-white/10 first:border-l-0 pl-4 first:pl-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-[#00a0e3]" />
        <span className="public-search-label">{label}</span>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-0 text-white font-semibold text-sm focus:outline-none appearance-none cursor-pointer pr-6"
      >
        {children}
      </select>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export default function EventsSearch({
  cities = [],
  categories = [],
  initialSearch = "",
  initialCity = "ALL PORTUGAL",
  initialCategory = "ALL",
  basePath = "/",
  variant = "hero",
}: EventsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch || "");
  const [city, setCity] = useState(initialCity || "ALL PORTUGAL");
  const [category, setCategory] = useState(initialCategory || "ALL");
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cityOptions = [...cities].sort((a, b) => a.localeCompare(b, "pt-PT"));
  const categoryOptions = [...categories].sort((a, b) => a.localeCompare(b, "pt-PT"));

  const pushFilters = useCallback(
    (nextSearch: string, nextCity: string, nextCategory: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        const trimmed = nextSearch.trim();
        if (trimmed) params.set("search", trimmed);
        else params.delete("search");
        if (nextCity && nextCity !== "ALL PORTUGAL") params.set("city", nextCity);
        else params.delete("city");
        if (nextCategory && nextCategory !== "ALL") params.set("category", nextCategory);
        else params.delete("category");
        const qs = params.toString();
        router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
      });
    },
    [basePath, router, searchParams]
  );

  useEffect(() => {
    setSearch(initialSearch || searchParams.get("search") || "");
    setCity(initialCity || searchParams.get("city") || "ALL PORTUGAL");
    setCategory(initialCategory || searchParams.get("category") || "ALL");
  }, [initialSearch, initialCity, initialCategory, searchParams]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushFilters(value, city, category), 350);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const hasFilters =
    search.trim().length > 0 ||
    (city && city !== "ALL PORTUGAL") ||
    (category && category !== "ALL");

  const wrapperCls =
    variant === "hero"
      ? "public-search-bar p-2 sm:p-3"
      : "rounded-xl border border-white/10 bg-[#14141f] p-3";

  return (
    <div className="space-y-3">
      <div className={wrapperCls}>
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-0 lg:gap-0">
          <div className="flex-1 flex items-center gap-3 px-4 py-3 lg:py-4 border-b lg:border-b-0 lg:border-r border-white/10">
            <Search className="h-5 w-5 text-[#00a0e3] shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="public-search-label block mb-1">O quê?</span>
              <input
                type="search"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Festival, concerto, nome do evento..."
                className="public-search-field"
              />
            </div>
          </div>

          {cityOptions.length > 0 && (
            <div className="px-4 py-3 lg:py-4 border-b lg:border-b-0 lg:border-r border-white/10 lg:min-w-[200px]">
              <FilterSelect label="Onde?" icon={MapPin} value={city} onChange={(v) => { setCity(v); pushFilters(search, v, category); }}>
                <option value="ALL PORTUGAL">Todo Portugal</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c} className="bg-[#14141f]">{c}</option>
                ))}
              </FilterSelect>
            </div>
          )}

          {categoryOptions.length > 0 && (
            <div className="px-4 py-3 lg:py-4 lg:min-w-[180px]">
              <FilterSelect label="Género" icon={Music2} value={category} onChange={(v) => { setCategory(v); pushFilters(search, city, v); }}>
                <option value="ALL">Todos</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c} className="bg-[#14141f]">{c}</option>
                ))}
              </FilterSelect>
            </div>
          )}
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {search.trim() && (
            <span className="rounded-full bg-[#00a0e3]/15 border border-[#00a0e3]/30 px-3 py-1 text-xs font-semibold text-[#5ec8f8]">
              {search.trim()}
            </span>
          )}
          {city && city !== "ALL PORTUGAL" && (
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
              {city}
            </span>
          )}
          {category && category !== "ALL" && (
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
              {category}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCity("ALL PORTUGAL");
              setCategory("ALL");
              if (debounceRef.current) clearTimeout(debounceRef.current);
              pushFilters("", "ALL PORTUGAL", "ALL");
            }}
            className="text-xs font-bold text-zinc-500 hover:text-white transition-colors px-2"
          >
            Limpar
          </button>
        </div>
      )}
    </div>
  );
}
