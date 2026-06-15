import Link from "next/link";

export function CityPills({ cities }: { cities: string[] }) {
  if (cities.length === 0) return null;

  const top = cities.slice(0, 8);

  return (
    <div className="flex flex-wrap gap-2">
      {top.map((city) => (
        <Link
          key={city}
          href={`/events?city=${encodeURIComponent(city)}`}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-[#00a0e3]/50 hover:bg-[#00a0e3]/10 hover:text-white transition-all"
        >
          {city}
        </Link>
      ))}
      <Link
        href="/events"
        className="rounded-full border border-dashed border-white/20 px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        Todas as cidades
      </Link>
    </div>
  );
}
