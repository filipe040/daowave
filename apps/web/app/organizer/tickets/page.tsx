import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizerTicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?from=/organizer/tickets");
  }

  const organizerProfile = await prisma.organizerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizerProfile || organizerProfile.status !== "APPROVED") {
    redirect("/");
  }

  // Get all tickets for this organizer's events
  const tickets = await prisma.ticket.findMany({
    where: {
      event: {
        organizerId: organizerProfile.id,
      },
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          startAt: true,
        },
      },
      ticketLot: {
        include: {
          ticketType: {
            select: {
              name: true,
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          paidAt: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Statistics
  const totalTickets = tickets.length;
  const issuedTickets = tickets.filter((t) => t.status === "ISSUED").length;
  const checkedInTickets = tickets.filter((t) => (t.entriesUsed as number) > 0).length;
  const cancelledTickets = tickets.filter((t) => t.status === "CANCELLED").length;

  // Group by event
  const ticketsByEvent = tickets.reduce((acc, ticket) => {
    const eventId = ticket.eventId;
    if (!acc[eventId]) {
      acc[eventId] = {
        event: ticket.event,
        tickets: [],
      };
    }
    acc[eventId].tickets.push(ticket);
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Bilhetes</h1>
        <p className="text-zinc-400">Gerir e acompanhar todos os bilhetes emitidos</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Total</span>
            <span className="text-2xl">🎫</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalTickets}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Emitidos</span>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{issuedTickets}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Validados</span>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{checkedInTickets}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Cancelados</span>
            <span className="text-2xl">❌</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{cancelledTickets}</p>
        </div>
      </div>

      {/* Tickets by Event */}
      {Object.keys(ticketsByEvent).length > 0 ? (
        <div className="space-y-6">
          {Object.values(ticketsByEvent).map((group: any) => {
            const eventTickets = group.tickets;
            const eventIssued = eventTickets.filter((t: any) => t.status === "ISSUED").length;
            const eventCheckedIn = eventTickets.filter((t: any) => (t.entriesUsed as number) > 0).length;

            return (
              <div
                key={group.event.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">{group.event.title}</h2>
                    <p className="text-sm text-zinc-400">
                      {format(new Date(group.event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-400">Total de bilhetes</p>
                    <p className="text-2xl font-bold text-white">{eventTickets.length}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-green-400">{eventIssued} emitidos</span>
                      <span className="text-blue-400">{eventCheckedIn} validados</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Tipo</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Participante</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Entradas</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Última Validação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventTickets.slice(0, 10).map((ticket: any) => (
                        <tr
                          key={ticket.id}
                          className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-sm font-mono text-zinc-400">
                            {ticket.id.substring(0, 8)}...
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {ticket.ticketLot.ticketType.name}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm font-medium">{ticket.attendeeName}</div>
                            <div className="text-xs text-zinc-500">{ticket.attendeeEmail}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                ticket.status === "ISSUED"
                                  ? "bg-green-500/20 text-green-400"
                                  : ticket.status === "CANCELLED"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {ticket.status === "ISSUED"
                                ? "Emitido"
                                : ticket.status === "CANCELLED"
                                ? "Cancelado"
                                : ticket.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {(ticket.entriesUsed as number) || 0} /{" "}
                            {ticket.event.checkinMode === "MULTI" ? ticket.event.maxEntries || "∞" : "1"}
                          </td>
                          <td className="py-3 px-4 text-sm text-zinc-400">
                            {ticket.lastCheckinAt
                              ? format(new Date(ticket.lastCheckinAt as Date), "dd MMM, HH:mm", { locale: pt })
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {eventTickets.length > 10 && (
                    <div className="mt-4 text-center text-sm text-zinc-400">
                      Mostrando 10 de {eventTickets.length} bilhetes
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="text-5xl mb-4 opacity-50">🎟️</div>
          <p className="text-lg text-zinc-400 mb-2">Ainda não há bilhetes emitidos</p>
          <p className="text-sm text-zinc-500">Os bilhetes aparecerão aqui após serem vendidos</p>
        </div>
      )}
    </div>
  );
}

