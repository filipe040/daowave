import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    pendingOrganizers,
    pendingEvents,
    totalEvents,
    publishedEvents,
    totalOrders,
    totalRevenue,
  ] = await Promise.all([
    prisma.promoterProfile.count({ where: { status: "PENDING" } }),
    prisma.event.count({
      where: {
        status: "DRAFT",
        promoter: { user: { role: "PROMOTER" } },
      },
    }),
    prisma.event.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalCents: true },
    }),
  ]);

  const revenueCents = totalRevenue._sum.totalCents ?? 0;

  const recentEvents = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      promoter: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  const pendingCount = pendingOrganizers + pendingEvents;

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 md:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Dashboard</h1>
          <p className="text-base md:text-lg text-zinc-400">Bem-vindo ao painel de administração</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {pendingCount > 0 && (
            <Link
              href="/admin/organizers?status=PENDING"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold text-white transition-all shadow-lg shadow-amber-500/20 hover:shadow-xl hover:scale-105 whitespace-nowrap"
            >
              Aprovar pendências ({pendingCount})
            </Link>
          )}
          <Link
            href="/admin/events/new"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold text-white transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 whitespace-nowrap"
          >
            + Criar Evento
          </Link>
        </div>
      </div>

      {/* Stats Grid - mesmo estilo do dashboard promotor */}
      <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl md:text-5xl mb-3">👥</div>
          <div className="text-4xl md:text-5xl font-bold mb-2">{pendingOrganizers}</div>
          <div className="text-sm md:text-base text-zinc-400">Promotores pendentes</div>
          <Link
            href="/admin/organizers?status=PENDING"
            className="mt-3 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Ver pendentes →
          </Link>
        </div>

        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl md:text-5xl mb-3">🎫</div>
          <div className="text-4xl md:text-5xl font-bold mb-2">{totalEvents}</div>
          <div className="text-sm md:text-base text-zinc-400">
            Total de eventos <span className="text-zinc-500">({publishedEvents} publicados)</span>
          </div>
          <Link
            href="/admin/events"
            className="mt-3 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Ver eventos →
          </Link>
        </div>

        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl md:text-5xl mb-3">🛒</div>
          <div className="text-4xl md:text-5xl font-bold mb-2">{totalOrders}</div>
          <div className="text-sm md:text-base text-zinc-400">Pedidos pagos</div>
          <Link
            href="/admin/payments"
            className="mt-3 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Ver pagamentos →
          </Link>
        </div>

        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-4xl md:text-5xl mb-3">💰</div>
          <div className="text-4xl md:text-5xl font-bold mb-2">
            {(revenueCents / 100).toFixed(2)}€
          </div>
          <div className="text-sm md:text-base text-zinc-400">Receita total</div>
          <Link
            href="/admin/payments"
            className="mt-3 inline-block text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Ver detalhes →
          </Link>
        </div>
      </div>

      {/* Ações rápidas - card estilo promotor */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Ações rápidas</h2>
          {pendingCount > 0 && (
            <span className="text-sm text-amber-400 font-medium">
              {pendingCount} pendência(s)
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/organizers?status=PENDING"
            className="flex items-center gap-4 p-5 rounded-xl border border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all group"
          >
            <span className="text-3xl">👤</span>
            <div>
              <div className="font-semibold group-hover:text-amber-400 transition-colors">
                Aprovar promotores
              </div>
              <div className="text-sm text-zinc-500">{pendingOrganizers} pendentes</div>
            </div>
            <span className="text-zinc-600 group-hover:text-amber-400 ml-auto text-xl">→</span>
          </Link>
          <Link
            href="/admin/events/pending"
            className="flex items-center gap-4 p-5 rounded-xl border border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all group"
          >
            <span className="text-3xl">📋</span>
            <div>
              <div className="font-semibold group-hover:text-purple-400 transition-colors">
                Aprovar eventos
              </div>
              <div className="text-sm text-zinc-500">{pendingEvents} em rascunho</div>
            </div>
            <span className="text-zinc-600 group-hover:text-purple-400 ml-auto text-xl">→</span>
          </Link>
          <Link
            href="/admin/events/new"
            className="flex items-center gap-4 p-5 rounded-xl border border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all group"
          >
            <span className="text-3xl">➕</span>
            <div>
              <div className="font-semibold group-hover:text-green-400 transition-colors">
                Criar evento
              </div>
              <div className="text-sm text-zinc-500">Novo evento como admin</div>
            </div>
            <span className="text-zinc-600 group-hover:text-green-400 ml-auto text-xl">→</span>
          </Link>
          <Link
            href="/admin/audit"
            className="flex items-center gap-4 p-5 rounded-xl border border-zinc-700/50 bg-zinc-900/50 hover:bg-zinc-900/80 transition-all group"
          >
            <span className="text-3xl">📜</span>
            <div>
              <div className="font-semibold group-hover:text-purple-400 transition-colors">
                Auditoria
              </div>
              <div className="text-sm text-zinc-500">Check-ins e transferências</div>
            </div>
            <span className="text-zinc-600 group-hover:text-purple-400 ml-auto text-xl">→</span>
          </Link>
        </div>
      </div>

      {/* Eventos recentes - mesmo layout do promotor */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Eventos recentes</h2>
          <Link
            href="/admin/events"
            className="text-sm md:text-base text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2 group"
          >
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className="text-5xl md:text-6xl mb-4 opacity-50">📅</div>
            <p className="text-lg md:text-xl text-zinc-400 mb-6">Ainda não há eventos</p>
            <Link
              href="/admin/events/new"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8 py-4 rounded-xl text-base md:text-lg font-semibold text-white transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
            >
              Criar evento
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                target="_blank"
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
                    {event.promoter?.user?.email && (
                      <span className="ml-2 text-zinc-600">· {event.promoter.user.email}</span>
                    )}
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
