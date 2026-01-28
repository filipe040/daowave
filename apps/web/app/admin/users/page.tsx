import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PromoteToOrganizerButton } from "../components/promote-to-organizer-button";
import { SearchAndPromoteUser } from "../components/search-and-promote-user";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = params.search?.toLowerCase().trim();

  const whereClause = searchTerm
    ? {
        OR: [
          { email: { contains: searchTerm } },
          { name: { contains: searchTerm } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      promoterProfile: {
        select: {
          id: true,
          brandName: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: users.length,
    customers: users.filter((u) => u.role === "USER").length,
    organizers: users.filter((u) => u.role === "PROMOTER").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    validators: 0, // VALIDATOR role removed
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Gestão de Utilizadores</h1>
        <p className="text-base md:text-lg text-zinc-400">Visualize e gerencie todos os utilizadores da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Total de Utilizadores</div>
          <div className="text-4xl font-bold text-blue-400">{stats.total}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Clientes</div>
          <div className="text-4xl font-bold text-green-400">{stats.customers}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Promotores</div>
          <div className="text-4xl font-bold text-purple-400">{stats.organizers}</div>
        </div>
        <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-700/50">
          <div className="text-sm text-zinc-400 mb-2">Administradores</div>
          <div className="text-4xl font-bold text-yellow-400">{stats.admins}</div>
        </div>
      </div>

      {/* Search and Promote */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6">
        <h2 className="text-xl font-semibold mb-4">Promover Utilizador por Email</h2>
        <p className="text-zinc-400 text-sm mb-4">
          Digite o email do utilizador para procurar e promover a promotor, mesmo que não apareça na lista abaixo.
        </p>
        <SearchAndPromoteUser />
      </div>

      {/* Users List */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
        <div className="p-6 border-b border-zinc-700/50 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lista de Utilizadores</h2>
          {searchTerm && (
            <div className="text-sm text-zinc-400">
              Resultados para: <span className="text-white font-semibold">{searchTerm}</span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Nome</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Perfil Promotor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Criado em</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-300">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">
                    Nenhum utilizador encontrado
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{user.name || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === "ADMIN"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : user.role === "PROMOTER"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {user.role === "ADMIN"
                          ? "Administrador"
                          : user.role === "PROMOTER"
                          ? "Promotor"
                          : "Cliente"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.promoterProfile ? (
                        <div>
                          <div className="font-semibold">{user.promoterProfile.brandName}</div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              user.promoterProfile.status === "APPROVED"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {user.promoterProfile.status === "APPROVED" ? "Aprovado" : "Pendente"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 text-sm">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{new Date(user.createdAt).toLocaleDateString("pt-PT")}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {user.role !== "PROMOTER" && user.role !== "ADMIN" && (
                          <PromoteToOrganizerButton userId={user.id} userEmail={user.email} />
                        )}
                        {user.promoterProfile && user.promoterProfile.status === "PENDING" && (
                          <Link
                            href={`/admin/organizers/${user.promoterProfile.id}`}
                            className="px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 text-sm transition-colors"
                          >
                            Aprovar
                          </Link>
                        )}
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

