import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        eventId: true,
        totalCents: true,
        status: true,
        createdAt: true,
        event: { select: { title: true, slug: true, startAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const tickets = await prisma.ticket.findMany({
      where: { order: { userId: session.user.id } },
      select: {
        id: true,
        code: true,
        orderId: true,
        eventId: true,
        checkedInAt: true,
        entriesUsed: true,
        createdAt: true,
        event: { select: { title: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      orders,
      tickets,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="easyticket-dados-${user.email.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.json"`,
      },
    });
  } catch (e) {
    console.error("[account-export] GET error:", e);
    return NextResponse.json(
      { error: "Erro ao exportar dados" },
      { status: 500 }
    );
  }
}
