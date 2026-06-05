import { prisma } from "../prisma";

export class OrganizationService {
    /**
     * Apagar organização e todos os dados associados (eventos, encomendas, bilhetes, etc.)
     * Apenas para uso por administradores da plataforma.
     */
    static async delete(organizationId: string) {
        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            select: {
                id: true,
                name: true,
                events: { select: { id: true } },
                ticketTemplates: { select: { id: true } },
            },
        });

        if (!org) {
            throw new Error("Organização não encontrada");
        }

        const eventIds = org.events.map((e) => e.id);
        const templateIds = org.ticketTemplates.map((t) => t.id);

        await prisma.$transaction(
            async (tx) => {
                if (eventIds.length > 0) {
                    const tickets = await tx.ticket.findMany({
                        where: { eventId: { in: eventIds } },
                        select: { id: true },
                    });
                    const ticketIds = tickets.map((t) => t.id);

                    if (ticketIds.length > 0) {
                        await tx.transferLog.deleteMany({
                            where: {
                                OR: [
                                    { fromTicketId: { in: ticketIds } },
                                    { toTicketId: { in: ticketIds } },
                                ],
                            },
                        });
                        await tx.ticketRenderSnapshot.deleteMany({
                            where: { ticketId: { in: ticketIds } },
                        });
                        await tx.checkinLog.deleteMany({
                            where: { eventId: { in: eventIds } },
                        });
                        await tx.ticket.deleteMany({
                            where: { id: { in: ticketIds } },
                        });
                    } else {
                        await tx.checkinLog.deleteMany({
                            where: { eventId: { in: eventIds } },
                        });
                    }

                    await tx.order.deleteMany({
                        where: { eventId: { in: eventIds } },
                    });

                    await tx.inventoryHold.deleteMany({
                        where: { eventId: { in: eventIds } },
                    });
                    await tx.seatHold.deleteMany({
                        where: { eventId: { in: eventIds } },
                    });

                    await tx.event.deleteMany({
                        where: { id: { in: eventIds } },
                    });
                }

                if (templateIds.length > 0) {
                    await tx.event.updateMany({
                        where: { ticketTemplateId: { in: templateIds } },
                        data: { ticketTemplateId: null },
                    });
                }

                await tx.ticketRenderSnapshot.deleteMany({
                    where: { organizationId },
                });

                await tx.payout.deleteMany({
                    where: { organizationId },
                });

                await tx.auditLog.updateMany({
                    where: { organizationId },
                    data: { organizationId: null },
                });

                await tx.organization.delete({
                    where: { id: organizationId },
                });
            },
            { timeout: 120_000 }
        );

        return { name: org.name, eventsDeleted: eventIds.length };
    }
}
