import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

export class SeatMapService {
    /**
     * Importa um mapa de lugares via CSV
     * Headers obrigatórios: section, row, number, label, ticketType
     */
    static async importFromCsv(eventId: string, name: string, csvContent: string) {
        // Obter os TicketTypes existentes para este evento para validar os lugares
        const ticketTypes = await prisma.ticketType.findMany({
            where: { eventId }
        });

        const typeMap = new Map(ticketTypes.map(t => [t.name.toLowerCase().trim(), t.id]));

        // Parse CSV
        let records: any[];
        try {
            records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
        } catch (e: any) {
            throw new Error(`Erro ao ler o ficheiro CSV: Formato inválido (${e.message})`);
        }

        if (records.length === 0) {
            throw new Error("O ficheiro CSV está vazio.");
        }

        // Validate Headers
        const firstRecord = records[0];
        const requiredHeaders = ["section", "row", "number", "label", "ticketType"];
        for (const header of requiredHeaders) {
            if (!(header in firstRecord)) {
                throw new Error(`CSV inválido: a coluna '${header}' é obrigatória.`);
            }
        }

        const seatsToCreate: any[] = [];
        const uniqueSet = new Set<string>();

        // Validate each row
        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const lineNum = i + 2; // +1 for header, +1 for 0-index

            if (!row.section) throw new Error(`Linha ${lineNum}: 'section' está vazia.`);
            if (!row.row) throw new Error(`Linha ${lineNum}: 'row' está vazia.`);
            if (!row.number) throw new Error(`Linha ${lineNum}: 'number' está vazia.`);
            if (!row.ticketType) throw new Error(`Linha ${lineNum}: 'ticketType' está vazia.`);

            const typeId = typeMap.get(row.ticketType.toLowerCase());
            if (!typeId) {
                throw new Error(`Linha ${lineNum}: o ticketType '${row.ticketType}' não existe neste evento. Crie o tipo de bilhete primeiro.`);
            }

            const uniqueKey = `${row.section}-${row.row}-${row.number}`;
            if (uniqueSet.has(uniqueKey)) {
                throw new Error(`Linha ${lineNum}: lugar duplicado (${uniqueKey}).`);
            }
            uniqueSet.add(uniqueKey);

            seatsToCreate.push({
                eventId,
                ticketTypeId: typeId,
                section: row.section,
                row: row.row,
                number: row.number,
                label: row.label || `${row.section} ${row.row}-${row.number}`,
                status: "AVAILABLE" as const
            });
        }

        // Insert into database atomically
        return await prisma.$transaction(async (tx) => {
            // Se já houver um mapa ativo, poderemos optar por desativar ou apagar os lugares não vendidos
            // Para simplificar no MVP, criamos um novo "mapa global" ou substituímos o existente se não houver vendas

            // Check if seats already sold
            const soldSeats = await tx.seat.count({
                where: { eventId, status: { not: "AVAILABLE" } }
            });

            if (soldSeats > 0) {
                throw new Error("Não é possível importar um novo mapa pois já existem lugares vendidos para este evento.");
            }

            // Cleanup old map for this event if it exists
            await tx.seatMap.deleteMany({ where: { eventId } });

            // Create new Map
            const seatMap = await tx.seatMap.create({
                data: {
                    eventId,
                    name,
                    version: 1,
                    publishedAt: new Date(),
                }
            });

            // Add seats
            await tx.seat.createMany({
                data: seatsToCreate.map(seat => ({
                    ...seat,
                    seatMapId: seatMap.id
                }))
            });

            return {
                seatMap,
                totalSeats: seatsToCreate.length
            };
        });
    }

    /**
     * Get statistics for the event's seat map
     */
    static async getStats(eventId: string) {
        const stats = await prisma.seat.groupBy({
            by: ['status'],
            where: { eventId },
            _count: true
        });

        const total = stats.reduce((acc, curr) => acc + curr._count, 0);
        const available = stats.find(s => s.status === 'AVAILABLE')?._count || 0;
        const sold = stats.find(s => s.status === 'SOLD')?._count || 0;
        const blocked = stats.find(s => s.status === 'BLOCKED')?._count || 0;

        return {
            total,
            available,
            sold,
            blocked
        };
    }
}
