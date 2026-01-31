import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/promotor");
  }

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Definições</h1>
        <p className="text-base md:text-lg text-zinc-400">
          Configuração do sistema, integrações e parâmetros globais.
        </p>
      </div>

      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6 md:p-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Definições do Sistema</h2>
        <p className="text-zinc-400 leading-relaxed">
          Em desenvolvimento — aqui ficarão opções de configuração do sistema,
          integrações (pagamentos, email, storage) e parâmetros globais. Para já,
          esta secção serve como espaço de gestão centralizado.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/promotor"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition-colors"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
