import { prisma } from "../prisma";
import { EventStatus, Prisma } from "@prisma/client";

export class EventService {
    /**
     * Create Event
     */
    static async create(data: Prisma.EventCreateInput) {
        return prisma.event.create({
            data,
        });
    }

    /**
     * Update Event
     */
    static async update(id: string, data: Prisma.EventUpdateInput) {
        return prisma.event.update({
            where: { id },
            data,
        });
    }

    /**
     * Get Organization Events
     */
    static async getByOrganization(orgId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        // Legacy support: checks both organizationId and promoterId (if migrated)
        // For now we assume new structure primarily
        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where: { organizationId: orgId },
                orderBy: { startAt: 'asc' },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { orders: true, tickets: true },
                    },
                },
            }),
            prisma.event.count({ where: { organizationId: orgId } })
        ]);

        return { events, total, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get Single Event with details
     */
    static async getById(id: string) {
        return prisma.event.findUnique({
            where: { id },
            include: {
                ticketLots: true,
                _count: {
                    select: { orders: true, tickets: true },
                },
            },
        });
    }

    /**
     * Manage Ticket Types (Lots)
     */
    static async upsertTicketLot(data: {
        id?: string;
        eventId: string;
        name: string;
        priceCents: number;
        quantityTotal: number;
        saleStartAt: Date;
        saleEndAt: Date;
    }) {
        if (data.id) {
            return prisma.ticketLot.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    priceCents: data.priceCents,
                    quantityTotal: data.quantityTotal,
                    saleStartAt: data.saleStartAt,
                    saleEndAt: data.saleEndAt,
                }
            });
        }

        return prisma.ticketLot.create({
            data: {
                eventId: data.eventId,
                name: data.name,
                priceCents: data.priceCents,
                quantityTotal: data.quantityTotal,
                saleStartAt: data.saleStartAt,
                saleEndAt: data.saleEndAt,
            }
        });
    }
}
