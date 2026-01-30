import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Ticket, MapPin, Calendar, CircleDollarSign } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizerEventsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?from=/organizer/events");
  }

  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizerProfile || organizerProfile.status !== "APPROVED") {
    redirect("/");
  }

  const events = await prisma.event.findMany({
    where: { promoterId: organizerProfile.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          tickets: {
            // TODO: Add status field to Ticket model or filter by checkedInAt
            // where: { status: "ISSUED" },
          },
          orders: {
            where: { status: "PAID" },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meus Eventos</h1>
          <p className="text-zinc-400">Gerir e publicar os seus eventos</p>
        </div>
        <Link
          href="/organizer/events/new"
          className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50"
        >
          + Novo Evento
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="mb-4 flex justify-center">
          <Ticket className="h-14 w-14 text-zinc-500" strokeWidth={1.5} />
        </div>
          <p className="text-lg text-zinc-400 mb-2">Ainda não criou nenhum evento</p>
          <p className="text-sm text-zinc-500 mb-6">Comece por criar o seu primeiro evento</p>
          <Link
            href="/organizer/events/new"
            className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/20"
          >
            Criar Evento
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm hover:border-zinc-700 hover:bg-zinc-900 transition-all"
            >
              <div className="flex items-start justify-between">
                <Link href={`/organizer/events/${event.id}/edit`} className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold group-hover:text-white transition-colors">
                      {event.title}
                    </h2>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        event.status === "PUBLISHED"
                          ? "bg-green-500/20 text-green-400"
                          : event.status === "DRAFT"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {event.status === "PUBLISHED"
                        ? "Publicado"
                        : event.status === "DRAFT"
                        ? "Rascunho"
                        : "Cancelado"}
                    </span>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
                      <span className="text-zinc-400">{event.venue}, {event.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
                      <span className="text-zinc-400">
                        {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
                      <span className="text-zinc-400">
                        {event._count.tickets} bilhetes vendidos
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
                      <span className="text-zinc-400">
                        {event._count.orders} encomendas pagas
                      </span>
                    </div>
                  </div>
                </Link>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Link
                    href={`/organizer/events/${event.id}/tickets`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    <Ticket className="h-4 w-4" strokeWidth={1.5} /> Bilhetes
                  </Link>
                  <Link
                    href={`/organizer/events/${event.id}/edit`}
                    className="px-4 py-2 rounded-lg border border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

