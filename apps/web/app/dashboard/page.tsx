import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { KpiGrid, KpiPresets } from "./components/kpi-grid";
import { EmptyState, LoadingSkeleton } from "./components/states";
import { AlertTriangleIcon, InfoIcon, CheckCircleIcon, TrendingUpIcon } from "lucide-react";

export const dynamic = "force-dynamic";

interface DashboardData {
  kpis: any[];
  alerts: Array<{
    id: string;
    type: "info" | "warning" | "success" | "error";
    title: string;
    message: string;
    href?: string;
  }>;
  recentActivity: any[];
}

async function getDashboardData(session: any): Promise<DashboardData> {
  const userRole = (session.user as any)?.role;

  try {
    if (userRole === "ADMIN") {
      // Admin dashboard data
      const [totalEvents, totalUsers, totalOrders, totalRevenue, pendingPromoters] = await Promise.all([
        prisma.event.count(),
        prisma.user.count(),
        prisma.order.count({ where: { status: "PAID" } }),
        prisma.order.aggregate({
          where: { status: "PAID" },
          _sum: { totalCents: true }
        }),
        prisma.promoterProfile.count({ where: { status: "PENDING" } }),
      ]);

      const kpis = [
        KpiPresets.events(totalEvents),
        KpiPresets.users(totalUsers),
        KpiPresets.orders(totalOrders),
        KpiPresets.revenue(totalRevenue._sum.totalCents || 0),
      ];

      const alerts = [];

      if (pendingPromoters > 0) {
        alerts.push({
          id: "pending-promoters",
          type: "warning" as const,
          title: "Promotores Pendentes",
          message: `${pendingPromoters} promotor(es) aguardam aprovação`,
          href: "/dashboard/promoters",
        });
      }

      return { kpis, alerts, recentActivity: [] };

    } else if (userRole === "PROMOTER") {
      // Promoter dashboard data
      const promoter = await prisma.promoterProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!promoter) {
        return {
          kpis: [],
          alerts: [{
            id: "no-promoter",
            type: "error",
            title: "Perfil não encontrado",
            message: "Não foi encontrado um perfil de promotor para esta conta",
          }],
          recentActivity: []
        };
      }

      const [events, orders, revenue] = await Promise.all([
        prisma.event.findMany({
          where: { promoterId: promoter.id },
          take: 5,
          orderBy: { createdAt: "desc" },
        }),
        prisma.order.count({
          where: {
            status: "PAID",
            event: { promoterId: promoter.id }
          }
        }),
        prisma.order.aggregate({
          where: {
            status: "PAID",
            event: { promoterId: promoter.id }
          },
          _sum: { totalCents: true }
        }),
      ]);

      const activeEvents = events.filter(e => e.status === "PUBLISHED").length;

      const kpis = [
        KpiPresets.events(events.length, activeEvents),
        KpiPresets.orders(orders),
        KpiPresets.revenue(revenue._sum.totalCents || 0),
      ];

      const alerts = [];

      if (promoter.status === "PENDING") {
        alerts.push({
          id: "pending-approval",
          type: "warning" as const,
          title: "Aprovação Pendente",
          message: "O seu perfil de promotor ainda está a aguardar aprovação",
        });
      }

      if (events.length === 0) {
        alerts.push({
          id: "no-events",
          type: "info" as const,
          title: "Primeiro Evento",
          message: "Crie o seu primeiro evento para começar a vender bilhetes",
          href: "/dashboard/events/new",
        });
      }

      return { kpis, alerts, recentActivity: events };
    }

    return { kpis: [], alerts: [], recentActivity: [] };

  } catch (error) {
    console.error("[dashboard] Error fetching data:", error);
    return {
      kpis: [],
      alerts: [{
        id: "data-error",
        type: "error",
        title: "Erro ao carregar dados",
        message: "Ocorreu um erro ao carregar os dados do dashboard",
      }],
      recentActivity: []
    };
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <div>Acesso negado</div>;
  }

  const data = await getDashboardData(session);
  const userRole = (session.user as any)?.role;

  const AlertIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "error":
        return <AlertTriangleIcon className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {userRole === "ADMIN" ? "Dashboard da Plataforma" : "Dashboard do Promotor"}
        </h1>
        <p className="text-gray-600">
          {userRole === "ADMIN"
            ? "Visão geral da plataforma e estatísticas globais"
            : "Gerir os seus eventos e acompanhar as vendas"
          }
        </p>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-4">
          {data.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-4 ${
                alert.type === "error"
                  ? "border-red-200 bg-red-50"
                  : alert.type === "warning"
                  ? "border-yellow-200 bg-yellow-50"
                  : alert.type === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
              }`}
              data-testid={`alert-${alert.id}`}
            >
              <div className="flex items-start">
                <AlertIcon type={alert.type} />
                <div className="ml-3 flex-1">
                  <h3 className={`text-sm font-medium ${
                    alert.type === "error"
                      ? "text-red-800"
                      : alert.type === "warning"
                      ? "text-yellow-800"
                      : alert.type === "success"
                      ? "text-green-800"
                      : "text-blue-800"
                  }`}>
                    {alert.title}
                  </h3>
                  <div className={`mt-1 text-sm ${
                    alert.type === "error"
                      ? "text-red-700"
                      : alert.type === "warning"
                      ? "text-yellow-700"
                      : alert.type === "success"
                      ? "text-green-700"
                      : "text-blue-700"
                  }`}>
                    {alert.message}
                  </div>
                  {alert.href && (
                    <div className="mt-3">
                      <a
                        href={alert.href}
                        className={`text-sm font-medium ${
                          alert.type === "error"
                            ? "text-red-600 hover:text-red-500"
                            : alert.type === "warning"
                            ? "text-yellow-600 hover:text-yellow-500"
                            : alert.type === "success"
                            ? "text-green-600 hover:text-green-500"
                            : "text-blue-600 hover:text-blue-500"
                        }`}
                      >
                        Ver detalhes →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      {data.kpis.length > 0 ? (
        <KpiGrid cards={data.kpis} columns={4} />
      ) : (
        <LoadingSkeleton type="cards" rows={4} />
      )}

      {/* Recent Activity */}
      {userRole === "PROMOTER" && data.recentActivity.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Eventos Recentes</h2>
              <a
                href="/dashboard/events"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Ver todos →
              </a>
            </div>
            <div className="space-y-4">
              {data.recentActivity.slice(0, 3).map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-500">
                      {event.venue}, {event.city} • {new Date(event.startAt).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : event.status === "DRAFT"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {event.status}
                    </span>
                    <a
                      href={`/dashboard/events/${event.id}`}
                      className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                    >
                      Ver →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Acções Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userRole === "ADMIN" ? (
              <>
                <a
                  href="/dashboard/events/new"
                  className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  data-testid="quick-action-new-event"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-blue-600 rounded-lg">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-900">Criar Evento</p>
                    <p className="text-sm text-blue-700">Adicionar novo evento</p>
                  </div>
                </a>
                <a
                  href="/dashboard/promoters"
                  className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-green-600 rounded-lg">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-900">Gerir Promotores</p>
                    <p className="text-sm text-green-700">Aprovar e gerir</p>
                  </div>
                </a>
                <a
                  href="/dashboard/analytics"
                  className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-purple-600 rounded-lg">
                      <TrendingUpIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-900">Ver Analytics</p>
                    <p className="text-sm text-purple-700">Estatísticas detalhadas</p>
                  </div>
                </a>
              </>
            ) : (
              <>
                <a
                  href="/dashboard/events/new"
                  className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  data-testid="quick-action-new-event"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-blue-600 rounded-lg">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-900">Novo Evento</p>
                    <p className="text-sm text-blue-700">Criar evento</p>
                  </div>
                </a>
                <a
                  href="/dashboard/analytics"
                  className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-green-600 rounded-lg">
                      <TrendingUpIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-900">Analytics</p>
                    <p className="text-sm text-green-700">Ver estatísticas</p>
                  </div>
                </a>
                <a
                  href="/dashboard/checkin"
                  className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 bg-purple-600 rounded-lg">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-900">Check-in</p>
                    <p className="text-sm text-purple-700">Scanner de bilhetes</p>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
