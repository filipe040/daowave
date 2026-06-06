import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { CircleDollarSign, Ticket, Package } from "lucide-react";

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
        <p className="text-neutral-500">Acompanhe as suas vendas e receitas</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Receita Total</span>
            <CircleDollarSign className="h-6 w-6 text-neutral-500" strokeWidth={1.5} />
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {(totalRevenue / 100).toFixed(2)} €
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Bilhetes Vendidos</span>
            <Ticket className="h-6 w-6 text-neutral-500" strokeWidth={1.5} />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{totalTickets}</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-500">Encomendas</span>
            <Package className="h-6 w-6 text-neutral-500" strokeWidth={1.5} />
          </div>
          <p className="text-2xl font-bold text-neutral-900">{totalOrders}</p>
        </div>
      </div>

      {/* Sales by Event */}
      {Object.keys(salesByEvent).length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4">Vendas por Evento</h2>
          <div className="space-y-4">
            {Object.values(salesByEvent).map((group: any) => (
              <div
                key={group.event.id}
                className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{group.event.title}</h3>
                    <p className="text-sm text-neutral-500">
                      {group.orders.length} {group.orders.length === 1 ? "encomenda" : "encomendas"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-neutral-900">
                      {(group.revenue / 100).toFixed(2)} €
                    </p>
                    <p className="text-sm text-neutral-500">
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
      <div className="rounded-xl border border-neutral-200 bg-white p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">Encomendas Recentes</h2>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <Package className="h-14 w-14 text-neutral-500" strokeWidth={1.5} />
            </div>
            <p className="text-lg text-neutral-500 mb-2">Ainda não há vendas</p>
            <p className="text-sm text-neutral-500">As encomendas pagas aparecerão aqui</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-500">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-500">Evento</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-500">Comprador</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-500">Bilhetes</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-neutral-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors"
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
                      <div className="text-neutral-500 text-xs">
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

