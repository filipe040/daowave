import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default async function OrganizerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?from=/organizer");
  }

  // Get organizer profile
  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizerProfile || organizerProfile.status !== "APPROVED") {
    // This will be handled by layout, but just in case
    redirect("/");
  }

  // Get events stats
  const [totalEvents, publishedEvents, draftEvents, totalTicketsSold, totalRevenue] = await Promise.all([
    prisma.event.count({ where: { promoterId: organizerProfile.id } }),
    prisma.event.count({ where: { promoterId: organizerProfile.id, status: "PUBLISHED" } }),
    prisma.event.count({ where: { promoterId: organizerProfile.id, status: "DRAFT" } }),
    prisma.ticket.count({
      where: {
        event: { promoterId: organizerProfile.id },
        // TODO: Add status field to Ticket model or filter by checkedInAt
        // status: "ISSUED",
      },
    }),
    prisma.order.aggregate({
      where: {
        event: { promoterId: organizerProfile.id },
        status: "PAID",
      },
      _sum: { totalCents: true },
    }),
  ]);

  // Get recent events
  const recentEvents = await prisma.event.findMany({
    where: { promoterId: organizerProfile.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      startAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Dashboard</h1>
          <p className="text-base md:text-lg text-zinc-400">Bem-vindo, {organizerProfile.brandName}</p>
        </div>
        <Link
          href="/organizer/events/new"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold text-white transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 whitespace-nowrap"
        >
          + Criar Evento
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl md:text-5xl mb-3">🎫</div>
          <div className="text-4xl md:text-5xl font-bold mb-2">{totalEvents}</div>
          <div className="text-sm md:text-base text-zinc-400">Total de Eventos</div>
        </div>
        
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl md:text-5xl mb-3">✅</div>
          <div className="text-4xl md:text-5xl font-bold mb-2">{publishedEvents}</div>
          <div className="text-sm md:text-base text-zinc-400">Publicados</div>
        </div>
        
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl md:text-5xl mb-3">📝</div>
          <div className="text-4xl md:text-5xl font-bold mb-2">{draftEvents}</div>
          <div className="text-sm md:text-base text-zinc-400">Rascunhos</div>
        </div>
        
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl md:text-5xl mb-3">💰</div>
          <div className="text-4xl md:text-5xl font-bold mb-2">
            {totalRevenue._sum.totalCents ? (totalRevenue._sum.totalCents / 100).toFixed(2) : "0.00"}€
          </div>
          <div className="text-sm md:text-base text-zinc-400">Receita Total</div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Eventos Recentes</h2>
          <Link
            href="/organizer/events"
            className="text-sm md:text-base text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2 group"
          >
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        
        {recentEvents.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className="text-5xl md:text-6xl mb-4 opacity-50">📅</div>
            <p className="text-lg md:text-xl text-zinc-400 mb-6">Ainda não criou nenhum evento</p>
            <Link
              href="/organizer/events/new"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-4 rounded-xl text-base md:text-lg font-semibold text-white transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
            >
              Criar Primeiro Evento
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/organizer/events/${event.id}/edit`}
                className="flex items-center justify-between p-5 md:p-6 rounded-xl border border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-base md:text-lg group-hover:text-purple-400 transition-colors truncate">
                      {event.title}
                    </h3>
                    <span
                      className={`text-xs md:text-sm px-3 py-1 rounded-lg ${
                        event.status === "PUBLISHED"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {event.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-zinc-500">
                    {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                  </p>
                </div>
                <span className="text-zinc-600 group-hover:text-purple-400 transition-colors ml-4 text-xl">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
