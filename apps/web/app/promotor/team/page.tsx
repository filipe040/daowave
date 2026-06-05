"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, X, Mail, ShieldCheck, Trash2, AlertTriangle } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";

interface OrgMember {
    id: string;
    role: "PROMOTER_OWNER" | "PROMOTER_MANAGER" | "PROMOTER_STAFF" | "OWNER" | "MANAGER" | "STAFF" | "READ_ONLY";
    createdAt: string;
    user: { id: string; name: string | null; email: string };
    organization: { id: string; name: string };
}

const ROLE_LABELS: Record<string, string> = {
    PROMOTER_OWNER: "Proprietário",
    PROMOTER_MANAGER: "Gestor",
    PROMOTER_STAFF: "Equipa",
    OWNER: "Proprietário",
    MANAGER: "Gestor",
    STAFF: "Equipa",
    READ_ONLY: "Leitor",
};

const ROLE_COLOR: Record<string, string> = {
    PROMOTER_OWNER: "bg-emerald-500/10 text-emerald-500",
    PROMOTER_MANAGER: "bg-blue-500/10 text-blue-500",
    PROMOTER_STAFF: "bg-amber-500/10 text-amber-500",
    OWNER: "bg-emerald-500/10 text-emerald-500",
    MANAGER: "bg-blue-500/10 text-blue-500",
    STAFF: "bg-amber-500/10 text-amber-500",
    READ_ONLY: "bg-white/5 text-white/40",
};

export default function PromoterTeamPage() {
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [canRemoveMembers, setCanRemoveMembers] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<OrgMember | null>(null);
    const [removing, setRemoving] = useState(false);

    // Invite Form
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("PROMOTER_STAFF");
    const [inviting, setInviting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/team");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json: {
                data: OrgMember[];
                meta?: { currentUserId?: string; canRemoveMembers?: boolean };
            } = await res.json();
            setMembers(json.data);
            setCurrentUserId(json.meta?.currentUserId ?? null);
            setCanRemoveMembers(json.meta?.canRemoveMembers ?? false);
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        try {
            const res = await fetchWithTimeout("/api/promotor/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao enviar convite");

            toast.success("Convite enviado com sucesso!");
            setShowInviteModal(false);
            setInviteEmail("");
            load();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async () => {
        if (!memberToRemove) return;
        setRemoving(true);
        try {
            const res = await fetchWithTimeout(`/api/promotor/team/${memberToRemove.id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Erro ao remover membro");

            toast.success(`${memberToRemove.user.name ?? memberToRemove.user.email} foi removido da equipa.`);
            setMemberToRemove(null);
            load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro ao remover membro");
        } finally {
            setRemoving(false);
        }
    };

    return (
        <PageShell
            title="Equipa"
            subtitle={members.length > 0 ? `${members.length} membro${members.length !== 1 ? "s" : ""}` : "Membros das suas organizações"}
            actions={
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-100 transition-all shadow-lg shadow-white/5"
                >
                    <UserPlus className="w-3.5 h-3.5" />
                    Convidar Membro
                </button>
            }
        >
            {loading && (
                <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-6 py-4 border-b border-white/5 last:border-0">
                            <Skeleton className="h-5 w-2/3 bg-white/5" />
                        </div>
                    ))}
                </div>
            )}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && members.length === 0 && (
                <EmptyState icon={Users} title="Sem membros" description="Ainda não existem membros nas suas organizações." />
            )}
            {!loading && !error && members.length > 0 && (
                <div className="bg-white/5 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                {["Membro", "Organização", "Função", "Desde", ...(canRemoveMembers ? ["Ações"] : [])].map((h) => (
                                    <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {members.map((m) => (
                                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{m.user.name ?? m.user.email.split('@')[0]}</div>
                                        <div className="text-[11px] text-white/30 font-medium">{m.user.email}</div>
                                    </td>
                                    <td className="px-6 py-5 text-white/40 font-bold uppercase tracking-tight text-xs">{m.organization.name}</td>
                                    <td className="px-6 py-5">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-current opacity-80 ${ROLE_COLOR[m.role]}`}>
                                            {ROLE_LABELS[m.role] || m.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-[11px] font-bold text-white/20 uppercase tracking-widest">
                                        {new Date(m.createdAt).toLocaleDateString("pt-PT")}
                                    </td>
                                    {canRemoveMembers && (
                                        <td className="px-6 py-5 text-right">
                                            {m.user.id === currentUserId ? (
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                                                    Você
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setMemberToRemove(m)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all"
                                                    aria-label={`Remover ${m.user.name ?? m.user.email}`}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Remover
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Remove confirmation */}
            {memberToRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => !removing && setMemberToRemove(null)}
                    />
                    <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[28px] shadow-2xl p-8">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-7 h-7 text-red-400" />
                            </div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">
                                Remover membro
                            </h2>
                            <p className="text-white/45 text-sm mt-3 leading-relaxed">
                                Tem a certeza que deseja remover{" "}
                                <strong className="text-white">
                                    {memberToRemove.user.name ?? memberToRemove.user.email}
                                </strong>{" "}
                                da equipa? Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                disabled={removing}
                                onClick={() => setMemberToRemove(null)}
                                className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/70 font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={removing}
                                onClick={handleRemove}
                                className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                            >
                                {removing ? "A remover..." : "Remover"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
                    <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200 p-8 sm:p-10">
                        <button
                            onClick={() => setShowInviteModal(false)}
                            className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4 mb-10">
                            <div className="w-16 h-16 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                                <UserPlus className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Convidar Membro</h2>
                                <p className="text-white/40 text-[13px] font-medium mt-1">Envie um convite para colaborar na sua organização.</p>
                            </div>
                        </div>

                        <form onSubmit={handleInvite} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2.5 ml-1">Endereço de Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colaborador@email.com"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 block mb-2.5 ml-1">Função na Equipa</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: "PROMOTER_OWNER", label: "Proprietário", desc: "Acesso total a todas as funcionalidades." },
                                        { id: "PROMOTER_MANAGER", label: "Gestor", desc: "Gere eventos e faturação, sem acesso a definições." },
                                        { id: "PROMOTER_STAFF", label: "Staff", desc: "Operacional para check-in e visualização de vendas." },
                                    ].map(role => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setInviteRole(role.id)}
                                            className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all ${inviteRole === role.id ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center shrink-0">
                                                <ShieldCheck className={`w-5 h-5 ${inviteRole === role.id ? 'text-white' : 'text-white/20'}`} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-white uppercase tracking-widest">{role.label}</div>
                                                <div className="text-[11px] text-white/40 mt-1 font-medium leading-relaxed">{role.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={inviting}
                                className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-gray-100 disabled:opacity-50 transition-all shadow-xl shadow-black/20"
                            >
                                {inviting ? "A enviar convite..." : "Enviar Convite"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
