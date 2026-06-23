import Link from "next/link";
import { MapPin } from "lucide-react";

export function CityPills({ cities }: { cities: string[] }) {
  if (cities.length === 0) return null;

  const top = cities.slice(0, 8);

  return (
    <div className="flex flex-wrap gap-2">
      {top.map((city) => (
        <Link
          key={city}
          href={`/events?city=${encodeURIComponent(city)}`}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-sm font-semibold text-zinc-400 hover:border-[#00a0e3]/40 hover:bg-[#00a0e3]/10 hover:text-white transition-all duration-200 hover:scale-[1.04]"
        >
          <MapPin className="h-3 w-3 text-zinc-600 group-hover:text-[#5ec8f8]" />
          {city}
        </Link>
      ))}
      <Link
        href="/events"
        className="flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-3.5 py-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-300 hover:border-white/25 transition-all duration-200"
      >
        + Todas
      </Link>
    </div>
  );
}
