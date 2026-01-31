import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            startAt: true,
            endAt: true,
          },
        },
        items: {
          include: {
            ticketLot: { select: { name: true, priceCents: true, currency: true } },
          },
        },
      },
    });
    return NextResponse.json({ orders });
  } catch (e) {
    console.error("[api/account/orders] GET error:", e);
    return NextResponse.json({ error: "Erro ao carregar encomendas" }, { status: 500 });
  }
}
