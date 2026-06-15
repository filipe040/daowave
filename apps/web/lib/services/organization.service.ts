import { prisma } from "../prisma";
import type { Prisma } from "@prisma/client";

async function deleteOrganizationWalletData(
    tx: Prisma.TransactionClient,
    organizationId: string
) {
    const wallet = await tx.wallet.findUnique({
        where: { organizationId },
        select: { id: true },
    });

    const orgLedgerTxs = await tx.ledgerTransaction.findMany({
        where: { organizationId },
        select: { id: true },
    });

    const txIds = new Set(orgLedgerTxs.map((t) => t.id));

    if (wallet) {
        const walletEntries = await tx.ledgerEntry.findMany({
            where: { walletId: wallet.id },
            select: { transactionId: true },
        });
        for (const entry of walletEntries) {
            txIds.add(entry.transactionId);
        }
    }

    const transactionIds = [...txIds];

    if (transactionIds.length > 0) {
        await tx.ledgerTransaction.updateMany({
            where: { reversedById: { in: transactionIds } },
            data: { reversedById: null },
        });

        await tx.refund.updateMany({
            where: { ledgerTransactionId: { in: transactionIds } },
            data: { ledgerTransactionId: null },
        });
        await tx.chargeback.updateMany({
            where: { ledgerTransactionId: { in: transactionIds } },
            data: { ledgerTransactionId: null },
        });

        await tx.withdrawalRequest.updateMany({
            where: { ledgerTransactionId: { in: transactionIds } },
            data: { ledgerTransactionId: null },
        });

        await tx.orderFinancialBreakdown.deleteMany({
            where: { ledgerTransactionId: { in: transactionIds } },
        });

        await tx.financialAuditLog.deleteMany({
            where: { transactionId: { in: transactionIds } },
        });

        await tx.walletTransaction.deleteMany({
            where: { ledgerTransactionId: { in: transactionIds } },
        });

        await tx.ledgerEntry.deleteMany({
            where: { transactionId: { in: transactionIds } },
        });

        await tx.ledgerTransaction.deleteMany({
            where: { id: { in: transactionIds } },
        });
    }

    if (wallet) {
        await tx.walletTransaction.deleteMany({ where: { walletId: wallet.id } });
        await tx.ledgerEntry.deleteMany({ where: { walletId: wallet.id } });
        await tx.withdrawalRequest.deleteMany({ where: { walletId: wallet.id } });
        await tx.wallet.delete({ where: { id: wallet.id } });
    } else {
        await tx.withdrawalRequest.deleteMany({ where: { organizationId } });
    }
}

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
                    const orders = await tx.order.findMany({
                        where: { eventId: { in: eventIds } },
                        select: { id: true },
                    });
                    const orderIds = orders.map((o) => o.id);

                    if (orderIds.length > 0) {
                        await tx.couponCommission.deleteMany({
                            where: { orderId: { in: orderIds } },
                        });
                        await tx.orderFinancialBreakdown.deleteMany({
                            where: { orderId: { in: orderIds } },
                        });
                    }

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

                await deleteOrganizationWalletData(tx, organizationId);

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
