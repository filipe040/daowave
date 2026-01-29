import AdminSidebar from "../components/admin-sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin/settings");
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminSidebar />
      <main className="ml-72 p-8">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold mb-4">Definições do Sistema</h1>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <p className="text-zinc-300">
              Em desenvolvimento — aqui ficarão opções de configuração do sistema,
              integrações e parâmetros globais. Para já, esta secção serve como
              espaço de gestão centralizado.
            </p>
            <div className="mt-4">
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                onClick={() => window.location.reload()}
              >
                Recarregar
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

