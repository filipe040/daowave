import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TicketDetail from "../../components/ticket-detail";

export const dynamic = "force-dynamic";

async function getTicket(id: string, userId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      event: {
        select: { id: true, title: true, slug: true, startAt: true, endAt: true },
      },
      ticketLot: { select: { id: true, name: true, priceCents: true, currency: true } },
      order: { select: { id: true, createdAt: true, totalCents: true, currency: true } },
    },
  });
  if (!ticket || ticket.userId !== userId) return null;
  return ticket;
}

export default async function AccountTicketDetailPage(props: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const { id } = await props.params;
  const ticket = await getTicket(id, session.user.id);
  if (!ticket) notFound();
  const serialized = {
    id: ticket.id,
    code: ticket.code,
    qrPayload: ticket.qrPayload,
    checkedInAt: ticket.checkedInAt?.toISOString() ?? null,
    createdAt: ticket.createdAt.toISOString(),
    event: ticket.event
      ? {
          ...ticket.event,
          startAt: ticket.event.startAt.toISOString(),
          endAt: ticket.event.endAt.toISOString(),
        }
      : null,
    ticketLot: ticket.ticketLot,
    order: ticket.order
      ? {
          ...ticket.order,
          createdAt: ticket.order.createdAt.toISOString(),
        }
      : null,
  };
  return <TicketDetail ticket={serialized} />;
}
