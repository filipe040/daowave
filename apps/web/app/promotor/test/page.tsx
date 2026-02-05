import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PromoterTestPage() {
  console.log("[promotor-test] Starting test page...");

  let session;
  try {
    session = await getServerSession(authOptions);
    console.log("[promotor-test] Session retrieved successfully");
  } catch (err) {
    console.error("[promotor-test] Session error:", err);
    return (
      <div className="p-8 bg-red-100 border border-red-400 rounded">
        <h1 className="text-2xl font-bold text-red-800">Erro de Sessão</h1>
        <p>Erro ao obter sessão: {(err as Error).message}</p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="p-8 bg-yellow-100 border border-yellow-400 rounded">
        <h1 className="text-2xl font-bold text-yellow-800">Sem Sessão</h1>
        <p>Nenhuma sessão ativa encontrada</p>
        <a href="/auth/signin" className="text-blue-600 underline">Fazer login</a>
      </div>
    );
  }

  const userRole = (session.user as { role?: string }).role;
  let testResults = {
    session: true,
    role: userRole,
    database: false,
    promoterProfile: null as any,
    error: null as string | null
  };

  try {
    console.log("[promotor-test] Testing database connection...");
    const userCount = await prisma.user.count();
    testResults.database = true;
    console.log("[promotor-test] Database OK, users:", userCount);

    if (userRole === "PROMOTER" || userRole === "ADMIN") {
      console.log("[promotor-test] Testing promoter profile...");
      const promoter = await prisma.promoterProfile.findUnique({
        where: { userId: session.user.id },
      });
      testResults.promoterProfile = promoter;
      console.log("[promotor-test] Promoter profile:", !!promoter);
    }
  } catch (err) {
    console.error("[promotor-test] Database error:", err);
    testResults.error = (err as Error).message;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🔍 Teste do Dashboard Promotor</h1>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-lg shadow ${testResults.session ? 'bg-green-100' : 'bg-red-100'}`}>
            <h2 className="text-xl font-semibold mb-2">
              {testResults.session ? '✅' : '❌'} Sessão
            </h2>
            <p className="text-sm">
              {testResults.session ? 'Sessão ativa' : 'Sem sessão'}
            </p>
          </div>

          <div className={`p-6 rounded-lg shadow ${testResults.database ? 'bg-green-100' : 'bg-red-100'}`}>
            <h2 className="text-xl font-semibold mb-2">
              {testResults.database ? '✅' : '❌'} Base de Dados
            </h2>
            <p className="text-sm">
              {testResults.database ? 'Conexão OK' : 'Erro de conexão'}
            </p>
          </div>

          <div className={`p-6 rounded-lg shadow ${(userRole === 'PROMOTER' || userRole === 'ADMIN') ? 'bg-green-100' : 'bg-yellow-100'}`}>
            <h2 className="text-xl font-semibold mb-2">
              {(userRole === 'PROMOTER' || userRole === 'ADMIN') ? '✅' : '⚠️'} Permissões
            </h2>
            <p className="text-sm">Role: {userRole}</p>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="space-y-6">
          {/* Session Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">📋 Informações da Sessão</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p><strong>ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Nome:</strong> {session.user.name || 'Não definido'}</p>
              </div>
              <div>
                <p><strong>Role:</strong> {userRole}</p>
                <p><strong>Pode acessar dashboard:</strong> {(userRole === 'PROMOTER' || userRole === 'ADMIN') ? 'Sim' : 'Não'}</p>
              </div>
            </div>
          </div>

          {/* Promoter Profile Info */}
          {testResults.promoterProfile && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">🏢 Perfil do Promotor</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p><strong>ID:</strong> {testResults.promoterProfile.id}</p>
                  <p><strong>Nome da Marca:</strong> {testResults.promoterProfile.brandName}</p>
                  <p><strong>Status:</strong> {testResults.promoterProfile.status}</p>
                </div>
                <div>
                  <p><strong>Email de Contacto:</strong> {testResults.promoterProfile.contactEmail || 'Não definido'}</p>
                  <p><strong>VAT:</strong> {testResults.promoterProfile.vatNumber || 'Não definido'}</p>
                  <p><strong>Criado em:</strong> {new Date(testResults.promoterProfile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Info */}
          {testResults.error && (
            <div className="bg-red-100 border border-red-400 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-red-800">❌ Erro Encontrado</h2>
              <p className="text-red-700 font-mono text-sm">{testResults.error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🔧 Ações</h2>
            <div className="space-y-2">
              <a
                href="/promotor"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
              >
                Tentar Dashboard Normal
              </a>
              <a
                href="/promotor/login"
                className="inline-block bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mr-4"
              >
                Página de Login
              </a>
              <a
                href="/auth/signin"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Login Geral
              </a>
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">ℹ️ Informação do Sistema</h2>
            <div className="text-sm space-y-1">
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              <p><strong>URL da Página:</strong> /promotor/test</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">📝 Próximos Passos</h2>
          <ul className="text-blue-700 space-y-2">
            <li>• Se esta página funciona, o problema não é na autenticação ou base de dados</li>
            <li>• Verifique os logs do servidor para o erro específico do dashboard</li>
            <li>• Execute: <code className="bg-blue-100 px-2 py-1 rounded">pm2 logs --lines 50</code></li>
            <li>• Se tudo estiver verde acima, o erro 500 pode ser no código do dashboard principal</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
