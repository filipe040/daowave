import { NextResponse } from "next/server";
import { EventArtistService } from "@/lib/services/event-artist.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const data = await EventArtistService.getPublishedByEventSlug(slug);

        if (!data) {
            return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
        }

        const artistsWithPrice = await Promise.all(
            data.artists.map(async (artist) => {
                const lot = artist.ticketType.ticketLots[0];
                let available = 0;
                let minPriceCents: number | null = lot?.priceCents ?? null;

                if (lot) {
                    const holds = await prisma.inventoryHold.aggregate({
                        where: {
                            ticketLotId: lot.id,
                            status: "ACTIVE",
                            expiresAt: { gt: new Date() },
                        },
                        _sum: { qty: true },
                    });
                    const capacity = lot.capacity > 0 ? lot.capacity : lot.quantityTotal;
                    available = Math.max(0, capacity - lot.soldCount - (holds._sum.qty || 0));
                }

                return {
                    id: artist.id,
                    name: artist.name,
                    slug: artist.slug,
                    imageUrl: artist.imageUrl,
                    performanceAt: artist.performanceAt,
                    venue: artist.venue,
                    badgeLabel: artist.badgeLabel,
                    minPriceCents,
                    available,
                    soldOut: available <= 0,
                };
            })
        );

        return NextResponse.json({
            event: data.event,
            artists: artistsWithPrice,
        });
    } catch (error) {
        console.error("[GET /api/events/[slug]/artists]", error);
        return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
}
