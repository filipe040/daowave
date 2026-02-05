import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getPromoterData(userId: string, userRole: string) {
  try {
    console.log("[dashboard] Fetching data for user:", userId, "role:", userRole);

    if (userRole === "ADMIN") {
      // Admin overview
      const [totalEvents, totalUsers, totalOrders] = await Promise.all([
        prisma.event.count(),
        prisma.user.count(),
        prisma.order.count({ where: { status: 'PAID' } })
      ]);

      return {
        isAdmin: true,
        stats: { totalEvents, totalUsers, totalOrders },
        events: []
      };
    }

    // Promoter data
    const promoter = await prisma.promoterProfile.findUnique({
      where: { userId },
    });

    if (!promoter) {
      return { isAdmin: false, promoter: null, events: [] };
    }

    const events = await prisma.event.findMany({
      where: { promoterId: promoter.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        venue: true,
        city: true,
        startAt: true,
        createdAt: true
      }
    });

    return {
      isAdmin: false,
      promoter,
      events
    };
  } catch (error) {
    console.error("[dashboard] Error fetching data:", error);
    throw error;
  }
}

export default async function PromoterDashboard() {
  console.log("[dashboard] Starting dashboard...");

  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[dashboard] Session error:", err);
    redirect("/promotor/login");
  }

  if (!session?.user) {
    redirect("/promotor/login");
  }

  const userRole = (session.user as { role?: string }).role;

  if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
          <p className="text-sm text-gray-500 mb-6">
            Esta área é exclusiva para promotores e administradores.
          </p>
          <p className="text-xs text-gray-400">
            Seu role atual: {userRole || 'Não definido'}
          </p>
          <div className="mt-6">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let data;
  try {
    data = await getPromoterData(session.user.id, userRole);
  } catch (err) {
    console.error("[dashboard] Error loading data:", err);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao Carregar</h3>
          <p className="text-sm text-gray-500 mb-6">
            Não foi possível carregar os dados do dashboard.
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {(err as Error)?.message || 'Erro desconhecido'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (data.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
            <p className="mt-2 text-sm text-gray-600">
              Bem-vindo, {session.user.name || session.user.email}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total de Eventos</dt>
                      <dd className="text-lg font-medium text-gray-900">{data.stats.totalEvents}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total de Utilizadores</dt>
                      <dd className="text-lg font-medium text-gray-900">{data.stats.totalUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Pedidos Pagos</dt>
                      <dd className="text-lg font-medium text-gray-900">{data.stats.totalOrders}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Acesso Rápido</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/admin/users"
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                >
                  <div className="text-sm font-medium text-gray-900">Utilizadores</div>
                </Link>
                <Link
                  href="/admin/events"
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                >
                  <div className="text-sm font-medium text-gray-900">Eventos</div>
                </Link>
                <Link
                  href="/admin/finance"
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                >
                  <div className="text-sm font-medium text-gray-900">Finanças</div>
                </Link>
                <Link
                  href="/admin/settings"
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
                >
                  <div className="text-sm font-medium text-gray-900">Definições</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No promoter profile found
  if (!data.promoter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Perfil Não Encontrado</h3>
          <p className="text-sm text-gray-500 mb-6">
            Não existe um perfil de promotor associado a esta conta.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-xs text-gray-600">
              <p><strong>User ID:</strong> {session.user.id}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>Role:</strong> {userRole}</p>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/admin/organizers/register"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Solicitar Perfil de Promotor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Promoter Dashboard
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard do Promotor</h1>
          <p className="mt-2 text-sm text-gray-600">
            {data.promoter.brandName} • Status: {data.promoter.status}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Meus Eventos</dt>
                    <dd className="text-lg font-medium text-gray-900">{data.events.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Status da Conta</dt>
                    <dd className="text-lg font-medium text-gray-900">{data.promoter.status}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Nome da Marca</dt>
                    <dd className="text-lg font-medium text-gray-900 truncate">{data.promoter.brandName}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Eventos Recentes</h2>
              <Link
                href="/promotor/events/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Novo Evento
              </Link>
            </div>

            {data.events.length > 0 ? (
              <div className="space-y-4">
                {data.events.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {event.venue}, {event.city}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(event.startAt).toLocaleDateString('pt-PT')} • Status: {event.status}
                        </p>
                      </div>
                      <Link
                        href={`/promotor/events/${event.id}`}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Ver →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum evento</h3>
                <p className="mt-1 text-sm text-gray-500">Crie o seu primeiro evento.</p>
                <div className="mt-6">
                  <Link
                    href="/promotor/events/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Criar Evento
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Acesso Rápido</h2>
            <div className="space-y-3">
              <Link
                href="/promotor/events/new"
                className="block p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Criar Novo Evento</div>
                    <div className="text-sm text-gray-500">Configure um novo evento</div>
                  </div>
                </div>
              </Link>

              <Link
                href="/promotor/analytics"
                className="block p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Analytics</div>
                    <div className="text-sm text-gray-500">Veja estatísticas dos eventos</div>
                  </div>
                </div>
              </Link>

              <Link
                href="/promotor/finance"
                className="block p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Finanças</div>
                    <div className="text-sm text-gray-500">Gerir pagamentos e receitas</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Dashboard Funcionando!</h3>
              <p className="mt-1 text-sm text-green-700">
                Esta é uma versão simplificada e estável do dashboard. Todas as funcionalidades básicas estão disponíveis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
