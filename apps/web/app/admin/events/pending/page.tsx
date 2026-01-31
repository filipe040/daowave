import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { ApproveEventButton } from "../components/approve-event-button";

export const dynamic = "force-dynamic";

export default async function AdminPendingEventsPage() {
  // Get all DRAFT events created by organizers (not admins)
  const pendingEvents = await prisma.event.findMany({
    where: {
      status: "DRAFT",
      promoter: {
        user: {
          role: "PROMOTER", // Only promoter events need approval
        },
      },
    },
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Eventos Pendentes de Aprovação</h1>
        <p className="text-base md:text-lg text-zinc-400">
          {pendingEvents.length === 0
            ? "Não há eventos pendentes de aprovação"
            : `${pendingEvents.length} evento(s) aguardando aprovação`}
        </p>
      </div>

      {pendingEvents.length === 0 ? (
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-12 text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Todos os eventos foram aprovados!</h2>
          <p className="text-zinc-400 mb-6">Não há eventos pendentes de aprovação no momento.</p>
          <Link
            href="/admin/events"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all"
          >
            Ver Todos os Eventos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
                    <p className="text-zinc-400 mb-4">{event.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Promotor:</span>{" "}
                        <span className="font-semibold">{event.promoter.brandName}</span>
                        <div className="text-zinc-400 text-xs">{event.promoter.user.email}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Local:</span>{" "}
                        <span className="font-semibold">{event.venue}</span>
                        <div className="text-zinc-400 text-xs">{event.city}</div>
                      </div>
                      <div>
                        <span className="text-zinc-500">Data de Início:</span>{" "}
                        <span className="font-semibold">
                          {new Date(event.startAt).toLocaleString("pt-PT")}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Data de Fim:</span>{" "}
                        <span className="font-semibold">
                          {new Date(event.endAt).toLocaleString("pt-PT")}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Criado em:</span>{" "}
                        <span className="font-semibold">
                          {new Date(event.createdAt).toLocaleString("pt-PT")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">
                      Aguardando Aprovação
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-700/50">
                  <ApproveEventButton eventId={event.id} />
                  <Link
                    href={`/promotor/events/${event.id}`}
                    className="px-4 py-2 rounded-xl border border-zinc-700/50 bg-zinc-800/50 text-white hover:bg-zinc-800 transition-colors"
                  >
                    Ver / Editar
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

