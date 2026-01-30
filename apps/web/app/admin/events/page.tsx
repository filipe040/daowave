import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    include: {
      promoter: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          tickets: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: events.length,
    published: events.filter((e) => e.status === "PUBLISHED").length,
    draft: events.filter((e) => e.status === "DRAFT").length,
    cancelled: 0, // EventStatus enum doesn't include CANCELED
  };

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Gestão de Eventos</h1>
          <p className="text-base md:text-lg text-zinc-400">Visualize e gerencie todos os eventos da plataforma</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin/events/pending"
            className="px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
          >
            Ver Pendentes
          </Link>
          <Link
            href="/admin/events/new"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all"
          >
            Criar Evento
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Total de Eventos</div>
          <div className="text-4xl font-bold text-blue-400">{stats.total}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Publicados</div>
          <div className="text-4xl font-bold text-green-400">{stats.published}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Rascunhos</div>
          <div className="text-4xl font-bold text-yellow-400">{stats.draft}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Cancelados</div>
          <div className="text-4xl font-bold text-red-400">{stats.cancelled}</div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-700/50">
          <h2 className="text-xl font-semibold">Lista de Eventos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Evento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Promotor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Data</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Bilhetes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                    Nenhum evento encontrado
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{event.title}</div>
                      <div className="text-sm text-zinc-400">{event.venue}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{event.promoter.user.name || "N/A"}</div>
                      <div className="text-sm text-zinc-400">{event.promoter.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{new Date(event.startAt).toLocaleDateString("pt-PT")}</div>
                      <div className="text-sm text-zinc-400">
                        {new Date(event.startAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{event._count.tickets}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={event.status === "PUBLISHED" ? `/events/${event.slug}` : `/organizer/events/${event.id}/edit`}
                        target={event.status === "PUBLISHED" ? "_blank" : undefined}
                        className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
                      >
                        {event.status === "PUBLISHED" ? "Ver página" : "Editar"}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

