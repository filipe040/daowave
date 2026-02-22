import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export class TicketTypeService {
    /**
     * Obter todos os tipos de bilhete de um evento
     */
    static async getByEvent(eventId: string) {
        return prisma.ticketType.findMany({
            where: { eventId },
            include: {
                _count: {
                    select: { ticketLots: true, seats: true }
                }
            },
            orderBy: { createdAt: "asc" }
        });
    }

    /**
     * Criar um novo tipo de bilhete
     */
    static async create(eventId: string, data: { name: string; description?: string; requiresSeat: boolean; perUserLimit?: number; status?: "ACTIVE" | "PAUSED" }) {
        return prisma.ticketType.create({
            data: {
                ...data,
                eventId
            }
        });
    }

    /**
     * Editar um tipo de bilhete
     */
    static async update(id: string, data: Partial<{ name: string; description: string; requiresSeat: boolean; perUserLimit: number; status: "ACTIVE" | "PAUSED" }>) {
        return prisma.ticketType.update({
            where: { id },
            data
        });
    }

    /**
     * Apagar um tipo de bilhete
     */
    static async delete(id: string) {
        // Validation happens in the API route (e.g. check if there are sold tickets)
        return prisma.ticketType.delete({
            where: { id }
        });
    }
}
