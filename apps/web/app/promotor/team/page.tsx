"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface OrgMember {
    id: string;
    role: "OWNER" | "MANAGER" | "STAFF" | "READ_ONLY";
    createdAt: string;
    user: { id: string; name: string | null; email: string };
    organization: { id: string; name: string };
}

const ROLE_LABELS: Record<OrgMember["role"], string> = {
    OWNER: "Proprietário",
    MANAGER: "Gestor",
    STAFF: "Equipa",
    READ_ONLY: "Leitor",
};

const ROLE_VARIANTS: Record<OrgMember["role"], "default" | "success" | "warning" | "muted"> = {
    OWNER: "success",
    MANAGER: "default",
    STAFF: "warning",
    READ_ONLY: "muted",
};

export default function PromoterTeamPage() {
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/team");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json: { data: OrgMember[] } = await res.json();
            setMembers(json.data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <PageShell
            title="Equipa"
            subtitle={members.length > 0 ? `${members.length} membro${members.length !== 1 ? "s" : ""}` : "Membros das suas organizações"}
        >
            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && members.length === 0 && (
                <EmptyState
                    icon={Users}
                    title="Sem membros"
                    description="Ainda não existem membros nas suas organizações."
                />
            )}

            {!loading && !error && members.length > 0 && (
                <div className="space-y-3">
                    {/* Desktop */}
                    <div className="hidden sm:block rounded-xl border border-zinc-700/60 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[500px]">
                                <thead className="bg-zinc-800/70">
                                    <tr>
                                        {["Membro", "Organização", "Função", "Desde"].map((h) => (
                                            <th key={h} className="p-3 text-left font-medium text-zinc-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((m, i) => (
                                        <tr key={m.id} className={i % 2 === 0 ? "bg-zinc-900/60" : "bg-zinc-800/30"}>
                                            <td className="p-3">
                                                <div className="font-medium text-white">{m.user.name ?? m.user.email}</div>
                                                <div className="text-xs text-zinc-400">{m.user.email}</div>
                                            </td>
                                            <td className="p-3 text-zinc-300">{m.organization.name}</td>
                                            <td className="p-3"><Badge variant={ROLE_VARIANTS[m.role]}>{ROLE_LABELS[m.role]}</Badge></td>
                                            <td className="p-3 text-xs text-zinc-400 whitespace-nowrap">
                                                {new Date(m.createdAt).toLocaleDateString("pt-PT")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-2">
                        {members.map((m) => (
                            <div key={m.id} className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0">
                                        <div className="font-medium text-white truncate">{m.user.name ?? m.user.email}</div>
                                        <div className="text-xs text-zinc-400 truncate">{m.user.email}</div>
                                    </div>
                                    <Badge variant={ROLE_VARIANTS[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-xs text-zinc-400">
                                    <span>{m.organization.name}</span>
                                    <span>{new Date(m.createdAt).toLocaleDateString("pt-PT")}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </PageShell>
    );
}
