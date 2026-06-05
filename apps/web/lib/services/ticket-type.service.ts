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
        const ticketType = await prisma.ticketType.findUnique({
            where: { id },
            include: {
                ticketLots: {
                    select: { id: true, soldCount: true, quantitySold: true },
                },
                _count: { select: { seats: true } },
            },
        });

        if (!ticketType) throw new Error("Tipo de bilhete não encontrado");

        const lotsWithSales = ticketType.ticketLots.filter(
            (lot) => (lot.soldCount ?? lot.quantitySold ?? 0) > 0
        );
        if (lotsWithSales.length > 0) {
            throw new Error("Não é possível apagar um tipo com lotes que já tenham vendas.");
        }

        if (ticketType.ticketLots.length > 0) {
            throw new Error("Remova primeiro os lotes associados a este tipo.");
        }

        if (ticketType._count.seats > 0) {
            throw new Error("Não é possível apagar um tipo com lugares marcados configurados.");
        }

        return prisma.ticketType.delete({ where: { id } });
    }
}
