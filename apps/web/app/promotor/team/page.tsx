"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
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

const ROLE_COLOR: Record<OrgMember["role"], string> = {
    OWNER: "bg-emerald-50 text-emerald-700",
    MANAGER: "bg-blue-50 text-blue-700",
    STAFF: "bg-amber-50 text-amber-700",
    READ_ONLY: "bg-gray-100 text-gray-500",
};

export default function PromoterTeamPage() {
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/team");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json: { data: OrgMember[] } = await res.json();
            setMembers(json.data);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <PageShell
            title="Equipa"
            subtitle={members.length > 0 ? `${members.length} membro${members.length !== 1 ? "s" : ""}` : "Membros das suas organizações"}
        >
            {loading && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 border-b border-gray-50 last:border-0">
                            <Skeleton className="h-5 w-2/3" />
                        </div>
                    ))}
                </div>
            )}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && members.length === 0 && (
                <EmptyState icon={Users} title="Sem membros" description="Ainda não existem membros nas suas organizações." />
            )}
            {!loading && !error && members.length > 0 && (
                <div className="space-y-3">
                    {/* Desktop table */}
                    <div className="hidden sm:block bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    {["Membro", "Organização", "Função", "Desde"].map((h) => (
                                        <th key={h} className="px-6 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {members.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{m.user.name ?? m.user.email}</div>
                                            <div className="text-xs text-gray-400">{m.user.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{m.organization.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${ROLE_COLOR[m.role]}`}>
                                                {ROLE_LABELS[m.role]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {new Date(m.createdAt).toLocaleDateString("pt-PT")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="sm:hidden space-y-3">
                        {members.map((m) => (
                            <div key={m.id} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0">
                                        <div className="font-medium text-gray-900 truncate">{m.user.name ?? m.user.email}</div>
                                        <div className="text-xs text-gray-400 truncate">{m.user.email}</div>
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${ROLE_COLOR[m.role]}`}>
                                        {ROLE_LABELS[m.role]}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-400">
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
