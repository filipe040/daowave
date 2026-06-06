import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const publishedEventsWhere: Prisma.EventWhereInput = {
  status: "PUBLISHED",
  archivedAt: null,
  endAt: { gte: new Date() },
};

export function normalizeCityFilter(value: string): string {
  return value.trim();
}

export function cityMatchValues(filterCity: string): string[] {
  const t = normalizeCityFilter(filterCity);
  if (!t) return [];
  const lower = t.toLocaleLowerCase("pt-PT");
  const titled = lower.charAt(0).toLocaleUpperCase("pt-PT") + lower.slice(1);
  return [...new Set([t, lower, titled, t.toUpperCase()])];
}

export function dedupeLabels(values: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const raw of values) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase("pt-PT");
    if (byKey.has(key)) continue;
    byKey.set(key, trimmed);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, "pt-PT"));
}

export async function getCitiesWithPublishedEvents(): Promise<string[]> {
  const rows = await prisma.event
    .findMany({
      where: publishedEventsWhere,
      select: { city: true },
    })
    .catch(() => []);

  return dedupeLabels(rows.map((r) => r.city));
}

export async function getCategoriesWithPublishedEvents(): Promise<string[]> {
  const rows = await prisma.event
    .findMany({
      where: {
        ...publishedEventsWhere,
        category: { not: null },
        NOT: { category: "" },
      },
      select: { category: true },
    })
    .catch(() => []);

  return dedupeLabels(rows.map((r) => r.category!).filter(Boolean));
}

export function buildPublicEventsWhere(filters: {
  search?: string;
  city?: string;
  category?: string;
}): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = { ...publishedEventsWhere };

  if (filters.city && filters.city !== "ALL PORTUGAL") {
    where.city = { in: cityMatchValues(filters.city) };
  }

  if (filters.category && filters.category !== "ALL") {
    where.category = filters.category;
  }

  const q = filters.search?.trim();
  if (q) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { city: { contains: q } },
          { venue: { contains: q } },
        ],
      },
    ];
  }

  return where;
}
