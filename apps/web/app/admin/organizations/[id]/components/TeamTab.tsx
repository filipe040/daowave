"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { Users, Mail, Trash2, Shield } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TeamMember {
    id: string;
    role: string;
    status: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        onboardingComplete: boolean;
        lastLoginAt?: string;
    };
}

const ROLE_LABELS: Record<string, string> = {
    PROMOTER_OWNER: "Proprietário",
    PROMOTER_MANAGER: "Gestor",
    PROMOTER_FINANCE: "Financeiro",
    PROMOTER_CASHIER: "Caixa (POS)",
    PROMOTER_CHECKIN: "Porteiro",
    READ_ONLY: "Leitor",
};

export function TeamTab({ organizationId }: { organizationId: string }) {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await api.get<TeamMember[]>(`/api/admin/organizations/${organizationId}/team`);
        if (error) toast.error(error);
        else setMembers(data || []);
        setLoading(false);
    }, [organizationId]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="bg-[#0c0c12] border border-white/10 shadow-sm rounded-[32px] overflow-hidden">
            <DataTable<TeamMember>
                data={members}
                loading={loading}
                keyField="id"
                emptyIcon={Users}
                emptyTitle="Sem membros"
                emptyDescription="Esta organização ainda não tem membros associados."
                columns={[
                    {
                        key: "user",
                        label: "Membro",
                        render: (m) => (
                            <div className="flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                                    {m.user.avatarUrl ? (
                                        <Image src={m.user.avatarUrl} alt={m.user.name || ""} fill className="object-cover" unoptimized />
                                    ) : (
                                        <Users className="h-4 w-4 text-zinc-500" />
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-white tracking-tight">{m.user.name || "Sem nome"}</div>
                                    <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">{m.user.email}</div>
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "role",
                        label: "Cargo",
                        render: (m) => (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold text-zinc-400">
                                <Shield className="h-3 w-3 text-zinc-500" />
                                {ROLE_LABELS[m.role] || m.role}
                            </div>
                        ),
                    },
                    {
                        key: "status",
                        label: "Estado",
                        render: (m) => (
                            <div className={cn(
                                "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest",
                                m.user.onboardingComplete ? "text-emerald-600" : "text-amber-600"
                            )}>
                                <div className={cn("w-1 h-1 rounded-full", m.user.onboardingComplete ? "bg-emerald-400" : "bg-amber-400")} />
                                {m.user.onboardingComplete ? "Ativo" : "Pendente Onboarding"}
                            </div>
                        ),
                    },
                    {
                        key: "joined",
                        label: "Desde",
                        render: (m) => (
                            <span className="text-[13px] font-medium text-zinc-500">
                                {new Date(m.createdAt).toLocaleDateString("pt-PT")}
                            </span>
                        ),
                    },
                ]}
                rowActions={(m) => (
                    <button
                        onClick={() => toast.info("Remoção de membros em desenvolvimento")}
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            />
        </div>
    );
}
