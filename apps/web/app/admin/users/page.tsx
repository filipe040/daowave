import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PromoteToOrganizerButton } from "../components/promote-to-organizer-button";
import { SearchAndPromoteUser } from "../components/search-and-promote-user";

export const dynamic = "force-dynamic";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "yellow" | "purple";
}) {
  const tones = {
    neutral: "bg-white/8 border-white/12 text-white/75",
    green: "bg-emerald-500/12 border-emerald-500/30 text-emerald-200",
    yellow: "bg-amber-500/12 border-amber-500/30 text-amber-200",
    purple: "bg-violet-500/12 border-violet-500/30 text-violet-200",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1",
        "text-[11px] font-semibold tracking-wide",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "blue" | "green" | "purple" | "yellow";
}) {
  const toneMap = {
    neutral: "text-white/92",
    blue: "text-sky-300",
    green: "text-emerald-300",
    purple: "text-violet-300",
    yellow: "text-amber-300",
  } as const;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "border border-white/10 bg-white/5 backdrop-blur-2xl",
        "p-6",
        "shadow-[0_18px_60px_rgba(0,0,0,.35)]"
      )}
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-white/6 blur-3xl" />
      <div className="relative">
        <div className="text-[11px] uppercase tracking-wider text-white/55">{label}</div>
        <div className={cn("mt-3 text-4xl font-semibold tracking-tight", toneMap[tone])}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;

  const searchRaw = (params.search ?? "").trim();
  const searchTerm = searchRaw.toLowerCase();

  const whereClause =
    searchTerm.length > 0
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
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-white/50">Admin</div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white/90">
          Gestão de utilizadores
        </h1>
        <p className="text-sm md:text-base text-white/55">
          Pesquisa, auditoria e promoção de contas.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard label="Total" value={stats.total} tone="blue" />
        <StatCard label="Clientes" value={stats.customers} tone="green" />
        <StatCard label="Promotores" value={stats.organizers} tone="purple" />
        <StatCard label="Admins" value={stats.admins} tone="yellow" />
      </div>

      {/* Search & Promote */}
      <div
        className={cn(
          "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl",
          "p-6 sm:p-7",
          "shadow-[0_18px_60px_rgba(0,0,0,.35)]"
        )}
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white/90">
              Promover utilizador por email
            </h2>
            <p className="mt-2 text-[12px] sm:text-[13px] text-white/55 max-w-3xl">
              Procura pelo email e promove a promotor mesmo que não esteja na lista atual.
            </p>
          </div>

          <Badge tone="neutral">Ação imediata</Badge>
        </div>

        <div className="mt-5">
          <SearchAndPromoteUser />
        </div>
      </div>

      {/* Users List */}
      <div
        className={cn(
          "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl",
          "overflow-hidden",
          "shadow-[0_18px_60px_rgba(0,0,0,.35)]"
        )}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-white/90">Lista de utilizadores</h2>

          {searchRaw && (
            <div className="text-[12px] text-white/55">
              Resultados para:{" "}
              <span className="text-white/85 font-semibold">{searchRaw}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/4">
              <tr>
                <th className="px-6 py-4 text-left text-[12px] font-semibold text-white/70">Nome</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold text-white/70">Email</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold text-white/70">Role</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold text-white/70">Perfil promotor</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold text-white/70">Criado</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold text-white/70">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-white/55">
                    Nenhum utilizador encontrado
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleLabel =
                    user.role === "ADMIN" ? "Administrador" : user.role === "PROMOTER" ? "Promotor" : "Cliente";

                  const roleTone =
                    user.role === "ADMIN" ? "yellow" : user.role === "PROMOTER" ? "purple" : "green";

                  return (
                    <tr key={user.id} className="hover:bg-white/4 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white/90">{user.name || "N/A"}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-white/80">{user.email}</div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge tone={roleTone as any}>{roleLabel}</Badge>
                      </td>

                      <td className="px-6 py-4">
                        {user.promoterProfile ? (
                          <div className="space-y-2">
                            <div className="font-semibold text-white/90">
                              {user.promoterProfile.brandName || "—"}
                            </div>
                            <Badge tone={user.promoterProfile.status === "APPROVED" ? "green" : "yellow"}>
                              {user.promoterProfile.status === "APPROVED" ? "Aprovado" : "Pendente"}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-white/45 text-sm">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-[12px] text-white/70">
                          {new Date(user.createdAt).toLocaleDateString("pt-PT")}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {user.role !== "PROMOTER" && user.role !== "ADMIN" && (
                            <PromoteToOrganizerButton userId={user.id} userEmail={user.email} />
                          )}

                          {user.promoterProfile?.status === "PENDING" && (
                            <Link
                              href={`/admin/organizers/${user.promoterProfile.id}`}
                              className={cn(
                                "inline-flex items-center rounded-xl border",
                                "border-amber-500/30 bg-amber-500/12 px-3 py-2",
                                "text-[12px] font-semibold text-amber-200",
                                "hover:bg-amber-500/16 hover:border-amber-500/40 transition"
                              )}
                            >
                              Aprovar
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}