import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type TicketLotCreateInput = {
    ticketTypeId?: string;
    name: string;
    description?: string;
    priceCents: number;
    capacity: number;
    startsAt?: Date;
    endsAt?: Date;
    status?: "ACTIVE" | "PAUSED";
    perUserLimit?: number;
};

export class TicketLotService {
    /**
     * Obter lotes de um evento, incluindo o tipo de bilhete
     */
    static async getByEvent(eventId: string) {
        return prisma.ticketLot.findMany({
            where: { eventId },
            include: {
                ticketType: true,
            },
            orderBy: { startsAt: "asc" }
        });
    }

    /**
     * Obter lote especifico
     */
    static async getById(id: string) {
        return prisma.ticketLot.findUnique({
            where: { id },
            include: { ticketType: true }
        });
    }

    /**
     * Criar um lote para o evento
     */
    static async create(eventId: string, data: TicketLotCreateInput) {
        return prisma.ticketLot.create({
            data: {
                eventId,
                ticketTypeId: data.ticketTypeId,
                name: data.name,
                description: data.description,
                priceCents: data.priceCents,
                capacity: data.capacity,
                startsAt: data.startsAt,
                endsAt: data.endsAt,
                status: data.status || "ACTIVE",
                perUserLimit: data.perUserLimit,

                // Mapeamento para legado
                quantityTotal: data.capacity,
                saleStartAt: data.startsAt || new Date(),
                saleEndAt: data.endsAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year 
                isActive: data.status !== "PAUSED"
            }
        });
    }

    /**
     * Atualizar lote 
     */
    static async update(id: string, data: Partial<TicketLotCreateInput>) {
        const updateData: Prisma.TicketLotUpdateInput = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.priceCents !== undefined) updateData.priceCents = data.priceCents;
        if (data.capacity !== undefined) {
            updateData.capacity = data.capacity;
            updateData.quantityTotal = data.capacity;
        }
        if (data.startsAt !== undefined) {
            updateData.startsAt = data.startsAt;
            updateData.saleStartAt = data.startsAt;
        }
        if (data.endsAt !== undefined) {
            updateData.endsAt = data.endsAt;
            updateData.saleEndAt = data.endsAt;
        }
        if (data.status !== undefined) {
            updateData.status = data.status;
            updateData.isActive = data.status !== "PAUSED";
        }
        if (data.perUserLimit !== undefined) updateData.perUserLimit = data.perUserLimit;
        if (data.ticketTypeId !== undefined) {
            updateData.ticketType = data.ticketTypeId
                ? { connect: { id: data.ticketTypeId } }
                : { disconnect: true };
        }

        return prisma.ticketLot.update({
            where: { id },
            data: updateData,
            include: { ticketType: true },
        });
    }
}
