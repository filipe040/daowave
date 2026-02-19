/**
 * EventService – business logic for events (organizer/promoter).
 * Used by API routes; auth and validation stay in routes.
 */

import { prisma } from "@/lib/prisma";
import type { Event, EventStatus, Prisma } from "@prisma/client";

export type CreateEventInput = {
  promoterId: string;
  organizationId?: string;
  title: string;
  slug: string;
  description: string;
  venue: string;
  city: string;
  startAt: Date;
  endAt: Date;
  bannerUrl?: string | null;
  checkinMode?: string;
  maxEntries?: number | null;
  checkinStartAt?: Date | null;
  checkinEndAt?: Date | null;
};

export type UpdateEventInput = Partial<{
  title: string;
  slug: string;
  description: string;
  venue: string;
  city: string;
  startAt: Date;
  endAt: Date;
  bannerUrl: string | null;
  checkinMode: string;
  maxEntries: number | null;
  checkinStartAt: Date | null;
  checkinEndAt: Date | null;
}>;

export type PublishValidationError = { field: string; message: string };
export type PublishValidation = { ok: true } | { ok: false; errors: PublishValidationError[] };

export const EventService = {
  /**
   * List events for a promoter (optionally minimal select).
   */
  async listByPromoter(
    promoterId: string,
    options?: { selectAll?: boolean }
  ): Promise<Event[] | { events: Pick<Event, "id" | "title" | "slug" | "startAt" | "status">[] }> {
    if (options?.selectAll) {
      const events = await prisma.event.findMany({
        where: { promoterId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          startAt: true,
          status: true,
        },
      });
      return { events };
    }
    return prisma.event.findMany({
      where: { promoterId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            tickets: true,
            orders: { where: { status: "PAID" } },
          },
        },
      },
    }) as Promise<Event[]>;
  },

  /**
   * List events for an organization (paginated).
   */
  async getByOrganization(
    organizationId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ events: Event[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              tickets: true,
              orders: { where: { status: "PAID" } },
            },
          },
        },
      }),
      prisma.event.count({ where: { organizationId } }),
    ]);

    return {
      events: events as Event[],
      total,
      pages: Math.ceil(total / limit),
    };
  },

  /**
   * Get a single event by id; optional ownership check (pass promoterId for non-admin).
   */
  async getById(
    id: string,
    options?: { promoterId?: string; isAdmin?: boolean }
  ): Promise<Event | null> {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketLots: true,
        _count: {
          select: {
            tickets: true,
            orders: { where: { status: "PAID" } },
          },
        },
      },
    });
    if (!event) return null;
    if (options?.isAdmin) return event as Event;
    if (options?.promoterId != null && event.promoterId !== options.promoterId) return null;
    return event as Event;
  },

  /**
   * Create event (only schema fields).
   */
  async create(input: CreateEventInput): Promise<Event> {
    const data: Prisma.EventCreateInput = {
      promoter: { connect: { id: input.promoterId } },
      ...(input.organizationId && { organization: { connect: { id: input.organizationId } } }),
      title: input.title,
      slug: input.slug,
      description: input.description,
      venue: input.venue,
      city: input.city,
      startAt: input.startAt,
      endAt: input.endAt,
      status: "DRAFT",
      ...(input.bannerUrl != null && { bannerUrl: input.bannerUrl }),
      ...(input.checkinMode != null && { checkinMode: input.checkinMode }),
      ...(input.maxEntries != null && { maxEntries: input.maxEntries }),
      ...(input.checkinStartAt != null && { checkinStartAt: input.checkinStartAt }),
      ...(input.checkinEndAt != null && { checkinEndAt: input.checkinEndAt }),
    };
    return prisma.event.create({ data });
  },

  /**
   * Update event (only provided schema fields).
   */
  async update(id: string, input: UpdateEventInput): Promise<Event> {
    const data: Prisma.EventUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.slug !== undefined) data.slug = input.slug;
    if (input.description !== undefined) data.description = input.description;
    if (input.venue !== undefined) data.venue = input.venue;
    if (input.city !== undefined) data.city = input.city;
    if (input.startAt !== undefined) data.startAt = input.startAt;
    if (input.endAt !== undefined) data.endAt = input.endAt;
    if (input.bannerUrl !== undefined) data.bannerUrl = input.bannerUrl;
    if (input.checkinMode !== undefined) data.checkinMode = input.checkinMode;
    // maxEntries removed from schema
    // if (input.maxEntries !== undefined) data.maxEntries = input.maxEntries;
    if (input.checkinStartAt !== undefined) data.checkinStartAt = input.checkinStartAt;
    if (input.checkinEndAt !== undefined) data.checkinEndAt = input.checkinEndAt;
    return prisma.event.update({ where: { id }, data });
  },

  /**
   * Validate that an event can be published. Returns structured errors { field, message } if not valid.
   */
  validatePublish(
    event: { title: string; description: string; venue: string; city: string; startAt: Date; endAt: Date; coverImage?: string | null; bannerUrl?: string | null },
    options?: { isAdmin?: boolean }
  ): PublishValidation {
    const errors: PublishValidationError[] = [];
    if (!event.title?.trim()) errors.push({ field: "title", message: "Título é obrigatório" });
    if (!event.description?.trim()) errors.push({ field: "description", message: "Descrição é obrigatória" });
    if (!event.venue?.trim()) errors.push({ field: "venueName", message: "Nome do local é obrigatório" });
    if (!event.city?.trim()) errors.push({ field: "city", message: "Cidade é obrigatória" });
    const hasBanner = !!(event.coverImage?.trim() || event.bannerUrl?.trim());
    if (!hasBanner) errors.push({ field: "bannerUrl", message: "Imagem de banner é obrigatória para publicar" });

    const startMs = new Date(event.startAt).getTime();
    const endMs = new Date(event.endAt).getTime();
    if (endMs <= startMs) errors.push({ field: "endAt", message: "Data de fim deve ser posterior à data de início" });
    const isAdmin = options?.isAdmin ?? false;
    if (!isAdmin && startMs < Date.now() - 5 * 60 * 1000) {
      errors.push({ field: "startAt", message: "Data de início não pode estar no passado" });
    }

    if (errors.length > 0) return { ok: false, errors };
    return { ok: true };
  },

  /**
   * Publish event (set status to PUBLISHED). Call validatePublish first.
   */
  async publish(id: string): Promise<Event> {
    return prisma.event.update({
      where: { id },
      data: { status: "PUBLISHED" as EventStatus },
    });
  },

  /**
   * Check slug uniqueness (excluding optional event id).
   */
  async isSlugTaken(slug: string, excludeEventId?: string): Promise<boolean> {
    const existing = await prisma.event.findFirst({
      where: {
        slug,
        ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
      },
    });
    return !!existing;
  },
};
