"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
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
    _count: { orders: number; tickets: number };
}

interface ApiResponse {
    data: AdminUser[];
    total: number;
    page: number;
    limit: number;
}

const ROLE_LABELS: Record<UserRole, string> = {
    USER: "Utilizador",
    PROMOTER: "Promotor",
    ADMIN: "Admin",
    VALIDATOR: "Validador",
};

const ROLE_VARIANTS: Record<UserRole, "default" | "danger" | "success" | "warning" | "muted"> = {
    ADMIN: "danger",
    PROMOTER: "success",
    VALIDATOR: "warning",
    USER: "muted",
};

const PAGE_LIMIT = 20;

export default function AdminUsersPage() {
    const [data, setData] = useState<AdminUser[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [role, setRole] = useState<string>("ALL");
    const [search, setSearch] = useState("");
    const [searchDebounced, setSearchDebounced] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actioning, setActioning] = useState<string | null>(null);

    // Debounce search
    useEffect(() => {
        const id = setTimeout(() => { setSearchDebounced(search); setPage(1); }, 400);
        return () => clearTimeout(id);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT) });
            if (role !== "ALL") params.set("role", role);
            if (searchDebounced) params.set("q", searchDebounced);
            const res = await fetchWithTimeout(`/api/admin/users?${params}`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json: ApiResponse = await res.json();
            setData(json.data);
            setTotal(json.total);
        } catch (err: any) {
            setError(err.message ?? "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, [page, role, searchDebounced]);

    useEffect(() => { load(); }, [load]);

    const handleAction = async (id: string, action: "ban" | "promote") => {
        setActioning(id);
        try {
            const body = action === "ban" ? { banned: true } : { role: "PROMOTER" as UserRole };
            const res = await fetchWithTimeout(`/api/admin/users/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error((err as any).error ?? `Erro ${res.status}`);
            }
            toast.success(action === "ban" ? "Utilizador banido" : "Utilizador promovido a Promotor");
            await load();
        } catch (err: any) {
            toast.error(err.message ?? "Erro na ação");
        } finally {
            setActioning(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

    return (
        <PageShell
            title="Utilizadores"
            subtitle={`${total} utilizador${total !== 1 ? "es" : ""} registados`}
            actions={
                <div className="flex gap-2">
                    <input
                        className="text-sm border border-zinc-700 bg-zinc-900 text-white rounded-md px-3 py-2 w-44 placeholder:text-zinc-500"
                        placeholder="Pesquisar…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="text-sm border border-zinc-700 bg-zinc-900 text-white rounded-md px-3 py-2"
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
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && data.length === 0 && (
                <EmptyState icon={Users} title="Sem utilizadores" description="Nenhum utilizador encontrado." />
            )}

            {!loading && !error && data.length > 0 && (
                <>
                    <div className="rounded-md border border-zinc-700 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-800">
                                <tr>
                                    <th className="p-3 text-left font-medium text-zinc-400">Utilizador</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Função</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Verificado</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Ordens</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Registado</th>
                                    <th className="p-3 text-left font-medium text-zinc-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((u, i) => (
                                    <tr key={u.id} className={i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-800/40"}>
                                        <td className="p-3">
                                            <div className="font-medium text-white">{u.name ?? "—"}</div>
                                            <div className="text-xs text-zinc-400">{u.email}</div>
                                        </td>
                                        <td className="p-3">
                                            <Badge variant={ROLE_VARIANTS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                                        </td>
                                        <td className="p-3">
                                            {u.emailVerified ? (
                                                <span className="text-emerald-400 text-xs font-medium">✓ Sim</span>
                                            ) : (
                                                <span className="text-zinc-500 text-xs">Não</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-zinc-300">{u._count.orders}</td>
                                        <td className="p-3 text-xs text-zinc-400">
                                            {new Date(u.createdAt).toLocaleDateString("pt-PT")}
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                {u.role === "USER" && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        disabled={actioning === u.id}
                                                        onClick={() => handleAction(u.id, "promote")}
                                                    >
                                                        Promover
                                                    </Button>
                                                )}
                                                {u.role !== "ADMIN" && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        disabled={actioning === u.id}
                                                        onClick={() => handleAction(u.id, "ban")}
                                                    >
                                                        Ban
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-zinc-400">Página {page} de {totalPages}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </PageShell>
    );
}
