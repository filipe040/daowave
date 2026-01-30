import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const [checkins, transfers] = await Promise.all([
    prisma.checkinLog.findMany({
      include: {
        ticket: {
          include: {
            event: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        validator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        scannedAt: "desc",
      },
      take: 100,
    }),
    prisma.transferLog.findMany({
      include: {
        fromTicket: {
          include: {
            event: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
        fromUser: {
          select: {
            name: true,
            email: true,
          },
        },
        toUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),
  ]);

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Auditoria</h1>
        <p className="text-base md:text-lg text-zinc-400">Registos de check-ins e transferências de bilhetes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Total de Check-ins</div>
          <div className="text-4xl font-bold text-green-400">{checkins.length}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Total de Transferências</div>
          <div className="text-4xl font-bold text-blue-400">{transfers.length}</div>
        </div>
      </div>

      {/* Check-ins */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-700/50">
          <h2 className="text-xl font-semibold">Check-ins Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Evento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Bilhete ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Validador</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Data/Hora</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {checkins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                    Nenhum check-in registado
                  </td>
                </tr>
              ) : (
                checkins.map((checkin) => (
                  <tr key={checkin.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{checkin.ticket.event.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm">{checkin.ticketId.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{checkin.validator?.name || "N/A"}</div>
                      <div className="text-sm text-zinc-400">{checkin.validator?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{new Date(checkin.scannedAt).toLocaleDateString("pt-PT")}</div>
                      <div className="text-sm text-zinc-400">
                        {new Date(checkin.scannedAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          checkin.result === "valid"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {checkin.result === "valid" ? "Válido" : "Inválido"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfers */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-700/50">
          <h2 className="text-xl font-semibold">Transferências Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Evento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Bilhete ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">De</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Para</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Data/Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                    Nenhuma transferência registada
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{transfer.fromTicket.event.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm">{transfer.fromTicketId.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{transfer.fromUser?.name || "N/A"}</div>
                      <div className="text-sm text-zinc-400">{transfer.fromUser?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{transfer.toUser?.name || "N/A"}</div>
                      <div className="text-sm text-zinc-400">{transfer.toUser?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{new Date(transfer.createdAt).toLocaleDateString("pt-PT")}</div>
                      <div className="text-sm text-zinc-400">
                        {new Date(transfer.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      </div>
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

