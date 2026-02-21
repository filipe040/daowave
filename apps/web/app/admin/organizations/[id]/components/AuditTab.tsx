"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { ShieldAlert, Activity, User, Globe } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    actorUserId: string | null;
    metaJson: any;
    ip: string | null;
    userAgent: string | null;
    createdAt: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    "org.created": { label: "Criação de Org", color: "text-emerald-400" },
    "org.status_changed": { label: "Alteração de Estado", color: "text-amber-400" },
    "invite.created": { label: "Convite Enviado", color: "text-sky-400" },
    "invite.accepted": { label: "Convite Aceite", color: "text-emerald-400" },
    "org.onboarding_updated": { label: "Atualização Onboarding", color: "text-indigo-400" },
};

export function AuditTab({ organizationId }: { organizationId: string }) {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const { data, error } = await api.get<AuditLog[]>(`/api/admin/organizations/${organizationId}/audit-logs`);
        if (error) toast.error(error);
        else setLogs(data || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [organizationId]);

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden">
            <DataTable<AuditLog>
                data={logs}
                loading={loading}
                keyField="id"
                emptyIcon={ShieldAlert}
                emptyTitle="Sem registos"
                emptyDescription="Ainda não existem ações registadas para esta organização."
                columns={[
                    {
                        key: "action",
                        label: "Ação",
                        render: (l) => {
                            const config = ACTION_LABELS[l.action] || { label: l.action, color: "text-white/40" };
                            return (
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.color.replace("text-", "bg-"))} />
                                    <span className={cn("text-[13px] font-bold tracking-tight", config.color)}>{config.label}</span>
                                </div>
                            );
                        },
                    },
                    {
                        key: "details",
                        label: "Detalhes",
                        render: (l) => (
                            <div className="text-[12px] text-white/30 font-medium max-w-xs truncate">
                                {JSON.stringify(l.metaJson)}
                            </div>
                        ),
                    },
                    {
                        key: "context",
                        label: "Origem",
                        render: (l) => (
                            <div className="flex items-center gap-4 text-[11px] font-bold text-white/20 uppercase tracking-widest">
                                <span className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {l.ip || "Sistema"}
                                </span>
                            </div>
                        ),
                    },
                    {
                        key: "createdAt",
                        label: "Data",
                        render: (l) => (
                            <span className="text-[13px] font-medium text-white/20">
                                {new Date(l.createdAt).toLocaleString("pt-PT", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </span>
                        ),
                    },
                ]}
            />
        </div>
    );
}
