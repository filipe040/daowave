import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TicketingCenterContent from "./components/ticketing-center-content";

export const dynamic = "force-dynamic";

async function getEventData(eventId: string, userId: string) {
  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId },
  });

  if (!promoter) {
    return null;
  }

  // Try to fetch with new badge fields; if they don't exist (DB not migrated), fall back gracefully
  try {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        promoterId: promoter.id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        badgeTemplateImageUrl: true,
        badgePrefix: true,
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

    return event;
  } catch (error: any) {
    const msg = String(error?.message || "");
    if (error?.code === "P2021" || msg.includes("Unknown column") || msg.includes("does not exist")) {
      // Fallback without badge-specific fields
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          promoterId: promoter.id,
        },
        select: {
          id: true,
          title: true,
          slug: true,
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

      if (!event) return null;

      return {
        ...event,
        badgeTemplateImageUrl: null as string | null,
        badgePrefix: null as string | null,
      };
    }

    throw error;
  }
}

export default async function EventTicketsPage({
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

  const event = await getEventData(id, session.user.id);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Evento não encontrado.</p>
      </div>
    );
  }

  // Calculate statistics (kept here so we can work with fallback event shape)
  const totalTickets = await prisma.ticket.count({
    where: { eventId: event.id },
  });

  const confirmedTickets = await prisma.ticket.count({
    where: {
      eventId: event.id,
      order: {
        status: "PAID",
      },
    },
  });

  const totalRevenue = await prisma.order.aggregate({
    where: {
      eventId: event.id,
      status: "PAID",
    },
    _sum: {
      totalCents: true,
    },
  });

  const totalOrders = await prisma.order.count({
    where: { eventId: event.id },
  });

  const completedOrders = await prisma.order.count({
    where: {
      eventId: event.id,
      status: "PAID",
    },
  });

  const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const expectedCheckIns = confirmedTickets;

  return (
    <TicketingCenterContent
      event={{
        id: event.id,
        title: event.title,
        slug: event.slug,
      }}
      stats={{
        ticketsIssued: totalTickets,
        confirmedSales: confirmedTickets,
        validatedRevenue: totalRevenue._sum.totalCents || 0,
        conversionRate,
        totalAudience: expectedCheckIns,
      }}
      badgeDesign={{
        templateImageUrl: (event as any).badgeTemplateImageUrl ?? null,
        prefix: (event as any).badgePrefix ?? null,
      }}
    />
  );
}
