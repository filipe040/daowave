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
    user: {
        id: string;
        name: string | null;
        email: string;
        avatarUrl: string | null;
    };
    organization: { id: string; name: string };
}

interface ApiResponse {
    data: OrgMember[];
    total: number;
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
            const json: ApiResponse = await res.json();
            setMembers(json.data);
        } catch (err: any) {
            setError(err.message ?? "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <PageShell
            title="Equipa"
            subtitle="Membros das suas organizações"
        >
            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
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
                <div className="rounded-md border border-zinc-700 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-800">
                            <tr>
                                <th className="p-3 text-left font-medium text-zinc-400">Membro</th>
                                <th className="p-3 text-left font-medium text-zinc-400">Organização</th>
                                <th className="p-3 text-left font-medium text-zinc-400">Função</th>
                                <th className="p-3 text-left font-medium text-zinc-400">Desde</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((m, i) => (
                                <tr key={m.id} className={i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-800/40"}>
                                    <td className="p-3">
                                        <div className="font-medium text-white">{m.user.name ?? m.user.email}</div>
                                        <div className="text-xs text-zinc-400">{m.user.email}</div>
                                    </td>
                                    <td className="p-3 text-zinc-300">{m.organization.name}</td>
                                    <td className="p-3">
                                        <Badge variant={ROLE_VARIANTS[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                                    </td>
                                    <td className="p-3 text-xs text-zinc-400">
                                        {new Date(m.createdAt).toLocaleDateString("pt-PT")}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </PageShell>
    );
}
