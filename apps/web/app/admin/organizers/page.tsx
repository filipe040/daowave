import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OrganizerStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminOrganizersPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status as OrganizerStatus | undefined;

  const organizers = await prisma.promoterProfile.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          events: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const statusCounts = await Promise.all([
    prisma.promoterProfile.count({ where: { status: "PENDING" } }),
    prisma.promoterProfile.count({ where: { status: "APPROVED" } }),
    prisma.promoterProfile.count({ where: { status: "REJECTED" } }),
  ]);

  const [pending, approved, rejected] = statusCounts;

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 md:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Gestão de Promotores</h1>
          <p className="text-base md:text-lg text-zinc-400">Aprovar ou rejeitar promotores</p>
        </div>
        <Link
          href="/admin/organizers/register"
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 whitespace-nowrap hover:scale-105"
        >
          + Registar Promotor
        </Link>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 md:gap-4">
        <Link
          href="/admin/organizers"
          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg border text-xs md:text-sm transition whitespace-nowrap ${
            !statusFilter
              ? "bg-purple-500/20 border-purple-500 text-purple-400"
              : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          }`}
        >
          Todos ({pending + approved + rejected})
        </Link>
        <Link
          href="/admin/organizers?status=PENDING"
          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg border text-xs md:text-sm transition whitespace-nowrap ${
            statusFilter === "PENDING"
              ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
              : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          }`}
        >
          Pendentes ({pending})
        </Link>
        <Link
          href="/admin/organizers?status=APPROVED"
          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg border text-xs md:text-sm transition whitespace-nowrap ${
            statusFilter === "APPROVED"
              ? "bg-green-500/20 border-green-500 text-green-400"
              : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          }`}
        >
          Aprovados ({approved})
        </Link>
        <Link
          href="/admin/organizers?status=REJECTED"
          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg border text-xs md:text-sm transition whitespace-nowrap ${
            statusFilter === "REJECTED"
              ? "bg-red-500/20 border-red-500 text-red-400"
              : "bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
          }`}
        >
          Rejeitados ({rejected})
        </Link>
      </div>

      {/* Organizers List - Responsive Table */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden shadow-lg">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50 border-b border-zinc-700/50">
              <tr>
                <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">
                  Promotor
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">
                  NIF/VAT
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">
                  Status
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">
                  Eventos
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">
                  Data
                </th>
                <th className="px-8 py-4 text-right text-sm font-semibold text-zinc-300">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {organizers.map((org) => (
                <tr key={org.id} className="hover:bg-zinc-700/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-semibold text-base mb-1">{org.brandName}</div>
                    <div className="text-sm text-zinc-400">
                      {org.user.email}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-base">
                    {org.vatNumber || "-"}
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        org.status === "APPROVED"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : org.status === "REJECTED"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-base">{org._count.events}</td>
                  <td className="px-8 py-5 text-base text-zinc-400">
                    {new Date(org.createdAt).toLocaleDateString("pt-PT")}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link
                      href={`/admin/organizers/${org.id}`}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium inline-flex items-center gap-1 group"
                    >
                      Ver detalhes
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-zinc-700/50">
          {organizers.map((org) => (
            <div key={org.id} className="p-6 hover:bg-zinc-700/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="font-semibold text-base truncate">{org.brandName}</div>
                  <div className="text-sm text-zinc-400 truncate">{org.user.email}</div>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ml-3 flex-shrink-0 ${
                    org.status === "APPROVED"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : org.status === "REJECTED"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  }`}
                >
                  {org.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-zinc-400 mb-4">
                <div>
                  <span className="text-zinc-500 font-medium">VAT:</span> {org.vatNumber || "-"}
                </div>
                <div>
                  <span className="text-zinc-500 font-medium">Eventos:</span> {org._count.events}
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 font-medium">Data:</span> {new Date(org.createdAt).toLocaleDateString("pt-PT")}
                </div>
              </div>
              <Link
                href={`/admin/organizers/${org.id}`}
                className="text-purple-400 hover:text-purple-300 text-sm font-medium block text-right flex items-center justify-end gap-1 group"
              >
                Ver detalhes
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          ))}
        </div>

        {organizers.length === 0 && (
          <div className="p-12 md:p-16 text-center text-zinc-400">
            <p className="text-lg md:text-xl">Nenhum promotor encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}

