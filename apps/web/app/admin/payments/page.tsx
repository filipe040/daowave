import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const orders = await prisma.order.findMany({
    include: {
      event: {
        select: {
          title: true,
          slug: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
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
    take: 100,
  });

  const stats = {
    total: orders.length,
    paid: orders.filter((o) => o.status === "PAID").length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    failed: 0, // OrderStatus enum doesn't include FAILED
    totalRevenue: orders
      .filter((o) => o.status === "PAID")
      .reduce((sum, o) => sum + o.totalCents, 0),
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Gestão de Pagamentos</h1>
        <p className="text-base md:text-lg text-zinc-400">Visualize e gerencie todos os pagamentos da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Total de Pedidos</div>
          <div className="text-4xl font-bold text-blue-400">{stats.total}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Pagamentos Confirmados</div>
          <div className="text-4xl font-bold text-green-400">{stats.paid}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Pendentes</div>
          <div className="text-4xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Receita Total</div>
          <div className="text-4xl font-bold text-purple-400">{(stats.totalRevenue / 100).toFixed(2)} €</div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-700/50">
          <h2 className="text-xl font-semibold">Pedidos Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Evento</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Bilhetes</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-400">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm">{order.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{order.event.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{order.user.name || "N/A"}</div>
                      <div className="text-sm text-zinc-400">{order.user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{order._count.tickets}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{(order.totalCents / 100).toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === "PAID"
                            ? "bg-green-500/20 text-green-400"
                            : order.status === "PENDING"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {order.status === "PAID"
                          ? "Pago"
                          : order.status === "PENDING"
                          ? "Pendente"
                          : "Falhado"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{new Date(order.createdAt).toLocaleDateString("pt-PT")}</div>
                      <div className="text-xs text-zinc-400">
                        {new Date(order.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
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

