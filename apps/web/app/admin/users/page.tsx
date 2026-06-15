"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";

type UserRole = "USER" | "PROMOTER" | "ADMIN" | "VALIDATOR";

interface AdminUser {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    emailVerified: boolean;
    createdAt: string;
    _count: { orders: number };
}

const ROLE_LABELS: Record<UserRole, string> = {
    USER: "Utilizador", PROMOTER: "Promotor", ADMIN: "Admin", VALIDATOR: "Validador",
};
const ROLE_COLOR: Record<UserRole, string> = {
    ADMIN: "bg-red-50 text-red-600 ring-red-200/60",
    PROMOTER: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
    VALIDATOR: "bg-amber-50 text-amber-700 ring-amber-200/60",
    USER: "bg-gray-100 text-gray-500 ring-gray-200/60",
};

const ALL_ROLES: UserRole[] = ["USER", "PROMOTER", "VALIDATOR", "ADMIN"];

const PAGE_LIMIT = 20;

// ─── Inline Role Selector ───────────────────────────────────────────────────
function RoleSelector({
    user,
    disabled,
    onRoleChange,
}: {
    user: AdminUser;
    disabled: boolean;
    onRoleChange: (id: string, newRole: UserRole) => void;
}) {
    return (
        <div className="relative inline-flex items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${ROLE_COLOR[user.role]}`}>
                {ROLE_LABELS[user.role]}
            </span>
            <select
                value={user.role}
                disabled={disabled}
                onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
                className="text-xs border border-gray-200 bg-[#14141f] text-gray-700 rounded-lg px-2 py-1 h-7 focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Alterar função"
            >
                {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
            </select>
            {disabled && (
                <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin absolute -right-5" />
            )}
        </div>
    );
}

// ───────────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const [data, setData] = useState<AdminUser[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [role, setRole] = useState("ALL");
    const [search, setSearch] = useState("");
    const [searchDebounced, setSearchDebounced] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Track which user IDs are currently being updated
    const [actioning, setActioning] = useState<Set<string>>(new Set());
    const mountedRef = useRef(true);

    useEffect(() => { return () => { mountedRef.current = false; }; }, []);

    useEffect(() => {
        const id = setTimeout(() => { setSearchDebounced(search); setPage(1); }, 400);
        return () => clearTimeout(id);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
            if (role !== "ALL") params.set("role", role);
            if (searchDebounced) params.set("q", searchDebounced);
            const res = await fetchWithTimeout(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { data: AdminUser[]; total: number };
            setData(json.data); setTotal(json.total);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoading(false); }
    }, [page, role, searchDebounced]);

    useEffect(() => { load(); }, [load]);

    // Change any role
    const handleRoleChange = useCallback(async (id: string, newRole: UserRole) => {
        setActioning((prev) => new Set(prev).add(id));
        try {
            const res = await fetchWithTimeout(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(err.error ?? `Erro ${res.status}`);
            }
            toast.success(`Função alterada para ${ROLE_LABELS[newRole]}`);
            if (mountedRef.current) await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro");
            if (mountedRef.current) await load(); // revert optimistic UI
        } finally {
            if (mountedRef.current) {
                setActioning((prev) => { const s = new Set(prev); s.delete(id); return s; });
            }
        }
    }, [load]);

    // Bloquear = downgrade to USER
    const handleBan = useCallback(async (id: string) => {
        setActioning((prev) => new Set(prev).add(id));
        try {
            const res = await fetchWithTimeout(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ banned: true }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(err.error ?? `Erro ${res.status}`);
            }
            toast.success("Utilizador bloqueado");
            if (mountedRef.current) await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro");
        } finally {
            if (mountedRef.current) {
                setActioning((prev) => { const s = new Set(prev); s.delete(id); return s; });
            }
        }
    }, [load]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

    return (
        <PageShell
            title="Utilizadores"
            subtitle={`${total} utilizador${total !== 1 ? "es" : ""} registados`}
            actions={
                <div className="flex flex-wrap gap-2">
                    <input
                        className="text-sm border border-gray-200 bg-[#14141f] text-gray-700 rounded-xl px-3 h-9 w-40 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        placeholder="Pesquisar…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="text-sm border border-gray-200 bg-[#14141f] text-gray-700 rounded-xl px-3 h-9 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                        value={role}
                        onChange={(e) => { setRole(e.target.value); setPage(1); }}
                    >
                        <option value="ALL">Todas as funções</option>
                        <option value="USER">Utilizador</option>
                        <option value="PROMOTER">Promotor</option>
                        <option value="ADMIN">Admin</option>
                        <option value="VALIDATOR">Validador</option>
                    </select>
                </div>
            }
        >
            {loading && (
                <div className="bg-[#14141f] rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 border-b border-gray-50 last:border-0">
                            <Skeleton className="h-5 w-2/3" />
                        </div>
                    ))}
                </div>
            )}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && data.length === 0 && (
                <EmptyState icon={Users} title="Sem utilizadores" description="Nenhum utilizador encontrado." />
            )}
            {!loading && !error && data.length > 0 && (
                <div className="space-y-4">
                    {/* Desktop table */}
                    <div className="hidden lg:block bg-[#14141f] rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {["Utilizador", "Função", "Verificado", "Ordens", "Registado", "Ações"].map((h) => (
                                        <th key={h} className="px-6 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{u.name ?? "—"}</div>
                                            <div className="text-xs text-gray-400">{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleSelector
                                                user={u}
                                                disabled={actioning.has(u.id)}
                                                onRoleChange={handleRoleChange}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.emailVerified
                                                ? <span className="text-emerald-600 text-xs">✓ Sim</span>
                                                : <span className="text-gray-400 text-xs">Não</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{u._count.orders}</td>
                                        <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                                            {new Date(u.createdAt).toLocaleDateString("pt-PT")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                {u.role !== "USER" && (
                                                    <button
                                                        disabled={actioning.has(u.id)}
                                                        onClick={() => handleBan(u.id)}
                                                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors"
                                                    >
                                                        Bloquear
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="lg:hidden space-y-3">
                        {data.map((u) => (
                            <div key={u.id} className="bg-[#14141f] rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-medium text-gray-900 truncate">{u.name ?? "—"}</div>
                                        <div className="text-xs text-gray-400 truncate">{u.email}</div>
                                    </div>
                                    <div className="shrink-0">
                                        <RoleSelector
                                            user={u}
                                            disabled={actioning.has(u.id)}
                                            onRoleChange={handleRoleChange}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">{u._count.orders} orden{u._count.orders !== 1 ? "s" : ""}</span>
                                    <div className="flex gap-2">
                                        {u.role !== "USER" && (
                                            <button
                                                disabled={actioning.has(u.id)}
                                                onClick={() => handleBan(u.id)}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-40 transition-colors"
                                            >
                                                Bloquear
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-400">Página {page} de {totalPages} · {total} total</p>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-[#14141f] hover:text-gray-700 disabled:opacity-30 border border-gray-200/80 transition-colors">
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-[#14141f] hover:text-gray-700 disabled:opacity-30 border border-gray-200/80 transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
