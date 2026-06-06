import { prisma } from "@/lib/prisma";

export function normalizeCityFilter(value: string): string {
  return value.trim();
}

/** Variantes para match de cidade (MySQL collation case-sensitive) */
export function cityMatchValues(filterCity: string): string[] {
  const t = normalizeCityFilter(filterCity);
  if (!t) return [];
  const lower = t.toLocaleLowerCase("pt-PT");
  const titled = lower.charAt(0).toLocaleUpperCase("pt-PT") + lower.slice(1);
  return [...new Set([t, lower, titled, t.toUpperCase()])];
}

/** Uma entrada por cidade (ignora diferenças de maiúsculas) */
export function dedupeCityNames(cities: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const raw of cities) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase("pt-PT");
    if (byKey.has(key)) continue;
    const titled = key.charAt(0).toLocaleUpperCase("pt-PT") + key.slice(1);
    byKey.set(key, titled);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, "pt-PT"));
}

/** Cidades com eventos publicados e futuros (para filtros públicos) */
export async function getCitiesWithPublishedEvents(): Promise<string[]> {
  const rows = await prisma.event
    .findMany({
      where: {
        status: "PUBLISHED",
        archivedAt: null,
        endAt: { gte: new Date() },
      },
      select: { city: true },
    })
    .catch(() => []);

  return dedupeCityNames(rows.map((r) => r.city));
}
