import { prisma } from "@/lib/prisma";
import { publishedEventsWhere } from "@/lib/events/public-event-filters";

export const publicOrgSelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  bannerUrl: true,
  publicBio: true,
  website: true,
  publicProfileEnabled: true,
} as const;

export async function getPublicOrganizationBySlug(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
    select: {
      ...publicOrgSelect,
      status: true,
    },
  });

  if (!org?.publicProfileEnabled || org.status !== "ACTIVE") {
    return null;
  }

  const events = await prisma.event.findMany({
    where: {
      ...publishedEventsWhere,
      organizationId: org.id,
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      city: true,
      venue: true,
      startAt: true,
      bannerUrl: true,
      coverImage: true,
      ticketLots: { select: { priceCents: true }, where: { isActive: true } },
    },
    take: 100,
  });

  return { ...org, events };
}

export async function listPublicOrganizationSlugs() {
  return prisma.organization
    .findMany({
      where: { publicProfileEnabled: true, status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    })
    .catch(() => []);
}
