import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await prisma.ticket.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        checkedInAt: true,
        createdAt: true,
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true,
            slug: true,
          },
        },
        ticketLot: {
          select: {
            id: true,
            name: true,
            priceCents: true,
            currency: true,
          },
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("[api/account/tickets] GET error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

