import { prisma } from "@/lib/prisma";
import {
    OrderSource,
    OrderStatus,
    ManualPaymentMethod,
    TicketStatus,
    MemberRole
} from "@prisma/client";
import { signQrPayload, TicketQrPayload } from "@ticketing-platform/shared";
import crypto from "crypto";
import { createAuditLog } from "@/lib/audit";

const QR_SECRET = process.env.QR_SECRET || "change-me-in-production";

export interface CreateManualSaleInput {
    organizationId: string;
    eventId: string;
    ticketLotId: string;
    quantity: number;
    paymentMethod: ManualPaymentMethod;
    paidNow: boolean;
    reference?: string;
    notes?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    idempotencyKey?: string;
}

export const ManualSaleService = {
    /**
     * Create a manual sale (POS)
     */
    async createManualSale(input: CreateManualSaleInput, actorId: string, actorRole: MemberRole) {
        // 1. RBAC Check
        if (actorRole === MemberRole.PROMOTER_STAFF) {
            throw new Error("PROMOTER_STAFF cannot create manual sales");
        }

        // 2. Idempotency Check
        if (input.idempotencyKey) {
            const existing = await prisma.order.findUnique({
                where: { idempotencyKey: input.idempotencyKey },
                include: { tickets: true }
            });
            if (existing) return existing;
        }

        // 3. Validate Stock & Event
        const event = await prisma.event.findUnique({
            where: { id: input.eventId },
            include: {
                ticketLots: {
                    where: { id: input.ticketLotId }
                }
            }
        });

        if (!event || event.organizationId !== input.organizationId) {
            throw new Error("Event not found or unauthorized");
        }

        const lot = event.ticketLots[0];
        if (!lot) throw new Error("Ticket lot not found");

        if (lot.quantitySold + input.quantity > lot.quantityTotal) {
            throw new Error(`Insufficient stock for ${lot.name}. Available: ${lot.quantityTotal - lot.quantitySold}`);
        }

        const totalCents = lot.priceCents * input.quantity;

        // 4. Transactional Creation
        return prisma.$transaction(async (tx) => {
            // Create Order
            const order = await tx.order.create({
                data: {
                    userId: actorId, // Manual sales are "owned" by the creator if no user assigned? 
                    // Actually, if customerEmail exists, we might want to link to a User, but for now we keep it guest-like
                    eventId: input.eventId,
                    totalCents,
                    source: OrderSource.MANUAL,
                    status: input.paidNow ? OrderStatus.PAID : OrderStatus.PENDING_MANUAL,
                    paidAt: input.paidNow ? new Date() : null,
                    idempotencyKey: input.idempotencyKey,
                    buyerName: input.customerName,
                    buyerEmail: input.customerEmail,
                    buyerPhone: input.customerPhone,
                }
            });

            // Create Manual Payment Record
            await tx.manualPayment.create({
                data: {
                    orderId: order.id,
                    method: input.paymentMethod,
                    reference: input.reference,
                    notes: input.notes,
                    customerName: input.customerName,
                    customerEmail: input.customerEmail,
                    customerPhone: input.customerPhone,
                    receivedByUserId: actorId,
                }
            });

            // Create Order Items
            await tx.orderItem.create({
                data: {
                    orderId: order.id,
                    ticketLotId: input.ticketLotId,
                    quantity: input.quantity,
                    unitPriceCents: lot.priceCents,
                }
            });

            // Create Tickets
            const tickets = [];
            const now = new Date();
            for (let i = 0; i < input.quantity; i++) {
                const ticketId = crypto.randomUUID();
                const nonce = crypto.randomBytes(8).toString("hex");

                const payload: TicketQrPayload = {
                    v: 1,
                    tid: ticketId,
                    eid: input.eventId,
                    n: nonce,
                    iat: Math.floor(now.getTime() / 1000),
                };

                const qrPayloadSigned = signQrPayload(payload, QR_SECRET);

                const ticket = await tx.ticket.create({
                    data: {
                        id: ticketId,
                        orderId: order.id,
                        eventId: input.eventId,
                        userId: actorId, // Placeholder, usually would be guest or client user
                        ticketLotId: input.ticketLotId,
                        code: `M-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
                        qrPayload: qrPayloadSigned,
                        status: TicketStatus.VALID,
                    }
                });
                tickets.push(ticket);
            }

            // Update Lot Sold Count
            await tx.ticketLot.update({
                where: { id: input.ticketLotId },
                data: { quantitySold: { increment: input.quantity } }
            });

            return { order, tickets };
        }).then(async (result) => {
            // Audit Log
            await createAuditLog({
                organizationId: input.organizationId,
                actorUserId: actorId,
                action: "order.manual.created",
                entityType: "Order",
                entityId: result.order.id,
                metaJson: {
                    paymentMethod: input.paymentMethod,
                    totalCents: totalCents,
                    ticketCount: input.quantity,
                }
            } as any);

            return result;
        });
    },

    /**
     * Mark a manual sale as paid
     */
    async markManualSalePaid(orderId: string, actorId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { manualPayment: true }
        });

        if (!order || order.source !== OrderSource.MANUAL) {
            throw new Error("Manual order not found");
        }

        if (order.status === OrderStatus.PAID) return order;

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.PAID,
                paidAt: new Date(),
            }
        });

        await createAuditLog({
            actorUserId: actorId,
            action: "order.manual.paid",
            entityType: "Order",
            entityId: orderId,
        } as any);

        return updated;
    },

    /**
     * Void a manual sale
     */
    async voidManualSale(orderId: string, actorId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                tickets: true,
                items: true
            }
        });

        if (!order || order.source !== OrderSource.MANUAL) {
            throw new Error("Manual order not found");
        }

        return prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: { status: OrderStatus.VOIDED }
            });

            // Cancel all tickets
            await tx.ticket.updateMany({
                where: { orderId },
                data: { status: TicketStatus.CANCELLED as any } // Cast to any as TicketStatus might not be perfectly synced in shared
            });

            // Restore stock
            for (const item of order.items) {
                await tx.ticketLot.update({
                    where: { id: item.ticketLotId },
                    data: { quantitySold: { decrement: item.quantity } }
                });
            }
        }).then(async () => {
            await createAuditLog({
                actorUserId: actorId,
                action: "order.manual.voided",
                entityType: "Order",
                entityId: orderId,
            } as any);
        });
    }
};
