import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        const event = await prisma.event.findUnique({
            where: { slug, status: "PUBLISHED" },
            include: {
                ticketTypes: {
                    where: { status: "ACTIVE" },
                    include: {
                        ticketLots: {
                            where: { status: "ACTIVE" }
                            // Include specific metrics later
                        }
                    }
                }
            }
        });

        if (!event) {
            return NextResponse.json({ error: "Evento não encontrado ou inativo" }, { status: 404 });
        }

        // Aggregate capacity per Type / Lot
        const availableTypes = await Promise.all(event.ticketTypes.map(async (type) => {
            const lots = await Promise.all(type.ticketLots.map(async (lot) => {

                const activeHoldsAgg = await prisma.inventoryHold.aggregate({
                    where: { ticketLotId: lot.id, status: "ACTIVE", expiresAt: { gt: new Date() } },
                    _sum: { qty: true }
                });

                const activeHoldsCount = activeHoldsAgg._sum.qty || 0;
                const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
                let available = capacity - lot.soldCount - activeHoldsCount;
                if (available < 0) available = 0;

                const saleStart = lot.startsAt ?? lot.saleStartAt;
                const saleEnd = lot.endsAt ?? lot.saleEndAt;
                const now = new Date();
                const isAvailable =
                    available > 0 && now >= saleStart && now <= saleEnd;

                return {
                    id: lot.id,
                    name: lot.name,
                    priceCents: lot.priceCents,
                    capacity,
                    soldCount: lot.soldCount,
                    available,
                    isAvailable,
                    perUserLimit: lot.perUserLimit
                };
            }));

            // Filter out types without lots or get min price
            const activeLots = lots.filter(l => l.isAvailable);
            const minPriceCents = activeLots.length > 0
                ? Math.min(...activeLots.map(l => l.priceCents))
                : null;

            return {
                id: type.id,
                name: type.name,
                description: type.description,
                requiresSeat: type.requiresSeat,
                perUserLimit: type.perUserLimit,
                minPriceCents,
                lots: lots // For selection in UI
            };
        }));

        // Filter types that actually have things to sell
        const visibleTypes = availableTypes.filter(t => t.lots.length > 0);

        const globalMinPrice = visibleTypes.length > 0
            ? Math.min(...visibleTypes.map(t => t.minPriceCents || Infinity))
            : null;

        return NextResponse.json({
            eventId: event.id,
            slug: event.slug,
            globalMinPriceCents: globalMinPrice !== Infinity ? globalMinPrice : null,
            ticketTypes: visibleTypes
        });

    } catch (error) {
        console.error("[GET /api/events/[slug]/tickets]", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
