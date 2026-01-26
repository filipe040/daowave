import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
        promoter: {
          user: {
            role: "PROMOTER",
          },
        },
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

   const revenue = totalRevenue._sum.totalCents || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Dashboard Admin</h1>
        <p className="text-base md:text-lg text-zinc-400">Gestão da plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm md:text-base text-zinc-400 mb-2">Promotores Pendentes</div>
          <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-3">
            {pendingOrganizers}
          </div>
          <Link
            href="/admin/organizers?status=PENDING"
            className="text-sm md:text-base text-purple-400 hover:text-purple-300 inline-flex items-center gap-2 group"
          >
            Ver todos
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm md:text-base text-zinc-400 mb-2">Total de Eventos</div>
          <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">{totalEvents}</div>
          <div className="text-sm md:text-base text-zinc-500">
            {publishedEvents} publicados
          </div>
        </div>

        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm md:text-base text-zinc-400 mb-2">Pedidos Pagos</div>
          <div className="text-4xl md:text-5xl font-bold text-green-400">{totalOrders}</div>
        </div>

        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/50 shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-sm md:text-base text-zinc-400 mb-2">Receita Total</div>
          <div className="text-4xl md:text-5xl font-bold text-purple-400">
            {(revenue / 100).toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/50 shadow-lg">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Link
            href="/admin/organizers?status=PENDING"
            className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-5 md:p-6 hover:bg-yellow-500/30 hover:border-yellow-500/70 transition-all hover:scale-105"
          >
            <div className="font-semibold text-base md:text-lg mb-2">Aprovar Promotores</div>
            <div className="text-sm md:text-base text-zinc-400">
              {pendingOrganizers} aguardando aprovação
            </div>
          </Link>

          <Link
            href="/admin/events/pending"
            className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-5 md:p-6 hover:bg-orange-500/30 hover:border-orange-500/70 transition-all hover:scale-105"
          >
            <div className="font-semibold text-base md:text-lg mb-2">Aprovar Eventos</div>
            <div className="text-sm md:text-base text-zinc-400">
              {pendingEvents} evento(s) pendente(s)
            </div>
          </Link>

          <Link
            href="/admin/events/new"
            className="bg-green-500/20 border border-green-500/50 rounded-xl p-5 md:p-6 hover:bg-green-500/30 hover:border-green-500/70 transition-all hover:scale-105"
          >
            <div className="font-semibold text-base md:text-lg mb-2">Criar Evento</div>
            <div className="text-sm md:text-base text-zinc-400">
              Criar novo evento como admin
            </div>
          </Link>

          <Link
            href="/admin/audit"
            className="bg-purple-500/20 border border-purple-500/50 rounded-xl p-5 md:p-6 hover:bg-purple-500/30 hover:border-purple-500/70 transition-all hover:scale-105"
          >
            <div className="font-semibold text-base md:text-lg mb-2">Ver Auditoria</div>
            <div className="text-sm md:text-base text-zinc-400">
              Transferências e check-ins
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

