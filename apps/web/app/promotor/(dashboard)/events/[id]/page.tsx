import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EventDashboardContent from "./components/event-dashboard-content";

export const dynamic = "force-dynamic";

async function getEventData(eventId: string, userId: string) {
  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId },
  });

  if (!promoter) {
    return null;
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      promoterId: promoter.id,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      startAt: true,
      endAt: true,
      city: true,
      venue: true,
      archivedAt: true,
      _count: {
        select: {
          tickets: true,
          orders: true,
        },
      },
      ticketLots: {
        include: {
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    return null;
  }

  // Get stats
  const totalTickets = await prisma.ticket.count({
    where: { eventId: event.id },
  });

  const checkedInTickets = await prisma.ticket.count({
    where: {
      eventId: event.id,
      checkedInAt: { not: null },
    },
  });

  const totalSales = await prisma.order.aggregate({
    where: {
      eventId: event.id,
      status: "PAID",
    },
    _sum: {
      totalCents: true,
    },
  });

  return {
    event,
    stats: {
      totalTickets,
      checkedInTickets,
      totalSales: totalSales._sum.totalCents || 0,
      totalOrders: event._count.orders,
    },
  };
}

export default async function EventDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/promotor/login");
  }

  const userRole = (session.user as any).role;
  if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Acesso restrito a promotores.</p>
      </div>
    );
  }

  const data = await getEventData(id, session.user.id);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Evento não encontrado.</p>
      </div>
    );
  }

  return (
    <EventDashboardContent
      event={{
        ...data.event,
        archivedAt: (data.event as any).archivedAt || null,
      }}
      stats={data.stats}
    />
  );
}
