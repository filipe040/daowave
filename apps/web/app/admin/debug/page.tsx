import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CheckCircle, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDebugPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Debug - Informações da Sessão</h1>

      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700/50">
        <h2 className="text-xl font-semibold mb-4">Dados da Sessão</h2>
        <pre className="bg-zinc-900 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-8 border border-zinc-700/50">
        <h2 className="text-xl font-semibold mb-4">Verificações</h2>
        <ul className="space-y-2">
          <li className="flex items-center gap-2">
            <strong>Sessão existe:</strong> {session ? <><CheckCircle className="h-4 w-4 text-emerald-500" /> Sim</> : <><XCircle className="h-4 w-4 text-red-500" /> Não</>}
          </li>
          <li className="flex items-center gap-2">
            <strong>User existe:</strong> {session?.user ? <><CheckCircle className="h-4 w-4 text-emerald-500" /> Sim</> : <><XCircle className="h-4 w-4 text-red-500" /> Não</>}
          </li>
          <li>
            <strong>Role:</strong> {session?.user?.role || "N/A"}
          </li>
          <li className="flex items-center gap-2">
            <strong>Role é ADMIN:</strong> {session?.user?.role === "ADMIN" ? <><CheckCircle className="h-4 w-4 text-emerald-500" /> Sim</> : <><XCircle className="h-4 w-4 text-red-500" /> Não</>}
          </li>
          <li>
            <strong>Tipo do role:</strong> {typeof session?.user?.role}
          </li>
        </ul>
      </div>
    </div>
  );
}
