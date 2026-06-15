"use client";

import { useState } from "react";
import { X, Mail, Shield, Send, Check, Copy } from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    onSuccess?: () => void;
}

const ROLES = [
    { id: "PROMOTER_OWNER", label: "Proprietário", description: "Acesso total e gestão da organização." },
    { id: "PROMOTER_MANAGER", label: "Gestor", description: "Pode criar eventos e gerir a equipa." },
    { id: "PROMOTER_STAFF", label: "Staff", description: "Pode gerir eventos e validar bilhetes." },
];

export function InviteModal({ isOpen, onClose, organizationId, onSuccess }: InviteModalProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("PROMOTER_MANAGER");
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data, error } = await api.post<any>(`/api/admin/organizations/${organizationId}/invites`, {
                email,
                role,
            });

            if (error) {
                toast.error(error);
            } else {
                toast.success("Convite gerado com sucesso!");
                setInviteLink(data.inviteLink);
                onSuccess?.();
            }
        } catch (err) {
            toast.error("Erro ao enviar convite");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        toast.success("Link copiado!");
    };

    const resetAndClose = () => {
        setEmail("");
        setRole("PROMOTER_MANAGER");
        setInviteLink(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md" onClick={resetAndClose} />

            {/* Content */}
            <div className="relative w-full max-w-lg bg-[#0c0c12] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Convidar Membro</h2>
                            <p className="text-zinc-500 text-sm mt-1">Envie um convite seguro para a sua equipa.</p>
                        </div>
                        <button onClick={resetAndClose} className="p-2 hover:bg-white/5 rounded-xl text-zinc-500 hover:text-white transition-all">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {!inviteLink ? (
                        <form onSubmit={handleInvite} className="space-y-8">
                            {/* Email */}
                            <div className="space-y-3">
                                <label className="public-label pl-1 mb-0">Email do Destinatário</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#00a0e3] transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="exemplo@email.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-white placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#00a0e3]/20 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {/* Role Select */}
                            <div className="space-y-3">
                                <label className="public-label pl-1 mb-0">Cargo e Permissões</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {ROLES.map((r) => {
                                        const selected = role === r.id;
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setRole(r.id)}
                                                className={cn(
                                                    "flex items-start gap-4 p-4 rounded-2xl border transition-all text-left",
                                                    selected
                                                        ? "bg-[#00a0e3] border-[#00a0e3] text-white"
                                                        : "bg-white/5 border-white/10 text-zinc-500 hover:bg-white/10"
                                                )}
                                            >
                                                <div className={cn("mt-1", selected ? "text-white" : "text-zinc-500")}>
                                                    <Shield className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-[13px] tracking-tight">{r.label}</div>
                                                    <div className={cn("text-[11px] font-medium mt-0.5", selected ? "text-white/80" : "text-zinc-500")}>
                                                        {r.description}
                                                    </div>
                                                </div>
                                                {selected && <Check className="h-4 w-4 ml-auto self-center text-black" strokeWidth={3} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                disabled={loading}
                                className="w-full h-14 bg-[#14141f] text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-black/10 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" strokeWidth={2.5} />
                                        Gerar Convite
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col items-center justify-center text-center p-8 bg-emerald-400/5 border border-emerald-400/10 rounded-[24px]">
                                <div className="w-16 h-16 rounded-full bg-emerald-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                                    <Check className="h-8 w-8 text-black" strokeWidth={3} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Convite Criado!</h3>
                                <p className="text-sm text-zinc-500 mt-1">Partilhe o link abaixo com o utilizador.</p>
                            </div>

                            <div className="space-y-3">
                                <label className="public-label pl-1 mb-0">Link de Ativação</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl h-14 px-4 flex items-center text-[13px] text-zinc-400 font-medium truncate">
                                        {inviteLink}
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="w-14 h-14 bg-white/5 hover:bg-[#14141f] text-zinc-500 hover:text-black border border-white/10 rounded-2xl flex items-center justify-center transition-all group"
                                    >
                                        <Copy className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={resetAndClose}
                                className="w-full h-14 border border-white/10 border border-white/10 hover:bg-white/10 text-zinc-300 rounded-2xl font-bold text-sm transition-all"
                            >
                                Fechar Janela
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
