import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizerSalesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?from=/organizer/sales");
  }

  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizerProfile || organizerProfile.status !== "APPROVED") {
    redirect("/");
  }

  // Get all paid orders for this organizer's events
  const orders = await prisma.order.findMany({
    where: {
      event: {
        promoterId: organizerProfile.id,
      },
      status: "PAID",
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      items: {
        include: {
          ticketLot: true,
        },
      },
      tickets: {
        select: {
          id: true,
          // status removed - not in schema
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // paidAt not in schema, use createdAt
    },
  });

  // Calculate statistics
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalCents, 0);
  const totalTickets = orders.reduce((sum, order) => sum + order.tickets.length, 0);
  const totalOrders = orders.length;

  // Group by event
  const salesByEvent = orders.reduce((acc, order) => {
    const eventId = order.eventId;
    if (!acc[eventId]) {
      acc[eventId] = {
        event: order.event,
        orders: [],
        revenue: 0,
        tickets: 0,
      };
    }
    acc[eventId].orders.push(order);
    acc[eventId].revenue += order.totalCents;
    acc[eventId].tickets += order.tickets.length;
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Vendas</h1>
        <p className="text-zinc-400">Acompanhe as suas vendas e receitas</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Receita Total</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {(totalRevenue / 100).toFixed(2)} €
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Bilhetes Vendidos</span>
            <span className="text-2xl">🎟️</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalTickets}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Encomendas</span>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalOrders}</p>
        </div>
      </div>

      {/* Sales by Event */}
      {Object.keys(salesByEvent).length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4">Vendas por Evento</h2>
          <div className="space-y-4">
            {Object.values(salesByEvent).map((group: any) => (
              <div
                key={group.event.id}
                className="border border-zinc-800 rounded-lg p-4 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{group.event.title}</h3>
                    <p className="text-sm text-zinc-400">
                      {group.orders.length} {group.orders.length === 1 ? "encomenda" : "encomendas"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {(group.revenue / 100).toFixed(2)} €
                    </p>
                    <p className="text-sm text-zinc-400">
                      {group.tickets} {group.tickets === 1 ? "bilhete" : "bilhetes"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">Encomendas Recentes</h2>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 opacity-50">📦</div>
            <p className="text-lg text-zinc-400 mb-2">Ainda não há vendas</p>
            <p className="text-sm text-zinc-500">As encomendas pagas aparecerão aqui</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Evento</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Comprador</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-400">Bilhetes</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm">
                      {order.createdAt
                        ? format(new Date(order.createdAt as Date), "dd MMM yyyy, HH:mm", { locale: pt })
                        : "-"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{order.event.title}</div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>{order.user.name || "N/A"}</div>
                      <div className="text-zinc-500 text-xs">
                        {order.user.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{order.tickets.length}</td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {(order.totalCents / 100).toFixed(2)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

