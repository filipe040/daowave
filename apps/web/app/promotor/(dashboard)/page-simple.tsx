import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PromoterDashboardSimple() {
  console.log("[simple-dashboard] Starting...");

  let session;
  try {
    session = await getServerSession(authOptions);
    console.log("[simple-dashboard] Session check passed");
  } catch (err) {
    console.error("[simple-dashboard] Session error:", err);
    redirect("/promotor/login");
  }

  if (!session?.user) {
    console.log("[simple-dashboard] No session, redirecting");
    redirect("/promotor/login");
  }

  const userRole = (session.user as { role?: string }).role;
  console.log("[simple-dashboard] User role:", userRole);

  if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p>Esta área é exclusiva para promotores e administradores.</p>
        <p>Seu role atual: {userRole}</p>
      </div>
    );
  }

  let promoter = null;
  let events: any[] = [];

  try {
    console.log("[simple-dashboard] Fetching promoter profile...");
    promoter = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });
    console.log("[simple-dashboard] Promoter found:", !!promoter);

    if (promoter) {
      console.log("[simple-dashboard] Fetching events...");
      events = await prisma.event.findMany({
        where: { promoterId: promoter.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true
        }
      });
      console.log("[simple-dashboard] Events found:", events.length);
    }
  } catch (err) {
    console.error("[simple-dashboard] Database error:", err);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Erro de Base de Dados</h1>
        <p>Erro: {(err as Error).message}</p>
      </div>
    );
  }

  if (userRole === "ADMIN") {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard Admin</h1>
        <p>Bem-vindo, administrador!</p>
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <h2 className="font-semibold">Informações da Sessão:</h2>
          <p>Email: {session.user.email}</p>
          <p>Nome: {session.user.name}</p>
          <p>Role: {userRole}</p>
        </div>
      </div>
    );
  }

  if (!promoter) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-yellow-600">Perfil Não Encontrado</h1>
        <p>Não existe um perfil de promotor associado a esta conta.</p>
        <div className="mt-4 p-4 bg-yellow-100 rounded">
          <h2 className="font-semibold">Dados da Sessão:</h2>
          <p>User ID: {session.user.id}</p>
          <p>Email: {session.user.email}</p>
          <p>Role: {userRole}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Promotor - Modo Simples</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Informações do Promotor</h2>
          <p><strong>ID:</strong> {promoter.id}</p>
          <p><strong>Nome da Marca:</strong> {promoter.brandName}</p>
          <p><strong>Status:</strong> {promoter.status}</p>
          <p><strong>Email de Contacto:</strong> {promoter.contactEmail || 'Não definido'}</p>
          <p><strong>Criado em:</strong> {promoter.createdAt.toLocaleDateString()}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Resumo de Eventos</h2>
          <p><strong>Total de Eventos:</strong> {events.length}</p>

          {events.length > 0 ? (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Eventos Recentes:</h3>
              <ul className="space-y-2">
                {events.map(event => (
                  <li key={event.id} className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-gray-600">Status: {event.status}</p>
                    <p className="text-sm text-gray-500">
                      {event.createdAt.toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-600 mt-4">Nenhum evento encontrado.</p>
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-100 rounded">
        <h2 className="font-semibold text-green-800">✅ Dashboard Simples Funcionando!</h2>
        <p className="text-green-700">
          Se consegue ver esta página, a autenticação e base de dados estão a funcionar.
        </p>
        <p className="text-sm text-green-600 mt-2">
          Agora pode investigar o que está a causar o erro 500 no dashboard principal.
        </p>
      </div>
    </div>
  );
}
