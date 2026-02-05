import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      event: {
        include: {
          promoter: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          createdAt: true,
          totalCents: true,
          currency: true,
        },
      },
      ticketLot: { select: { id: true, name: true, priceCents: true, currency: true } },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Bilhete não encontrado" }, { status: 404 });
  }
  if (ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(ticket);
}
