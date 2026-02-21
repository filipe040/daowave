"use client";

import { useEffect, useState, useCallback } from "react";
import { DataTable } from "@/components/dashboard/DataTable";
import { Mail, Copy, Check, Clock, Shield } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Invite {
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    inviteLink?: string; // May be provided on response
}

const ROLE_LABELS: Record<string, string> = {
    PROMOTER_OWNER: "Proprietário",
    PROMOTER_MANAGER: "Gestor",
    PROMOTER_STAFF: "Staff",
};

export function InvitesTab({ organizationId }: { organizationId: string }) {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [copying, setCopying] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await api.get<Invite[]>(`/api/admin/organizations/${organizationId}/invites`);
        if (error) toast.error(error);
        else setInvites(data || []);
        setLoading(false);
    }, [organizationId]);

    useEffect(() => { load(); }, [load]);

    const handleCopyToken = (invite: Invite) => {
        // In this implementation, tokens are hashed, so we can't get the raw token again
        // unless we just created it. For existing invites, we'd need a "Resend" mechanism
        // but for now let's just show the status.
        toast.info("O token original apenas está disponível no momento da criação por segurança.");
    };

    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden">
            <DataTable<Invite>
                data={invites}
                loading={loading}
                keyField="id"
                emptyIcon={Mail}
                emptyTitle="Sem convites"
                emptyDescription="Não existem convites pendentes para esta organização."
                columns={[
                    {
                        key: "email",
                        label: "Destinatário",
                        render: (i) => (
                            <div>
                                <div className="font-bold text-white tracking-tight">{i.email}</div>
                                <div className="text-[11px] font-medium text-white/30 uppercase tracking-widest mt-0.5">
                                    Convite Individual
                                </div>
                            </div>
                        ),
                    },
                    {
                        key: "role",
                        label: "Cargo Atribuído",
                        render: (i) => (
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold text-white/60">
                                <Shield className="h-3 w-3 text-white/20" />
                                {ROLE_LABELS[i.role] || i.role}
                            </div>
                        ),
                    },
                    {
                        key: "status",
                        label: "Estado",
                        render: (i) => {
                            const isExpired = new Date() > new Date(i.expiresAt);
                            return (
                                <div className={cn(
                                    "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest",
                                    i.status === "PENDING" && !isExpired ? "text-amber-400" : "text-white/20"
                                )}>
                                    <Clock className="h-3 w-3" />
                                    {isExpired ? "Expirado" : i.status}
                                </div>
                            );
                        },
                    },
                    {
                        key: "expires",
                        label: "Expira em",
                        render: (i) => (
                            <span className="text-[13px] font-medium text-white/20">
                                {new Date(i.expiresAt).toLocaleDateString("pt-PT")}
                            </span>
                        ),
                    },
                ]}
            />
        </div>
    );
}
