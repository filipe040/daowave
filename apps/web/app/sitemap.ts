import { prisma } from "@/lib/prisma";
import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/company";

const BASE = getAppBaseUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await prisma.event
    .findMany({
      where: { status: "PUBLISHED", archivedAt: null },
      select: { slug: true, updatedAt: true, city: true },
    })
    .catch(() => []);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/events`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/sobre-nos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/politica-reembolsos`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/ral`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  const eventPages: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE}/events/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const cities = [...new Set(events.map((e) => e.city).filter(Boolean))];
  const cityPages: MetadataRoute.Sitemap = cities.map((city) => ({
    url: `${BASE}/eventos/${encodeURIComponent(city.toLowerCase())}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...eventPages, ...cityPages];
}
