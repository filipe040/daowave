"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Building2, Check, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import NextImage from "next/image";

interface InviteData {
    id: string;
    email: string;
    role: string;
    organization: {
        name: string;
        logoUrl?: string;
    };
    expiresAt: string;
}

export default function InviteAcceptPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [invite, setInvite] = useState<InviteData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const validate = useCallback(async () => {
        if (!token) {
            setError("Token de convite em falta.");
            setLoading(false);
            return;
        }

        try {
            const { data, error: apiError } = await api.get<InviteData>(`/api/invites/${token}`);
            if (apiError) setError(apiError);
            else setInvite(data);
        } catch (err) {
            setError("Erro ao validar convite");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { validate(); }, [validate]);

    const handleAccept = async () => {
        if (!token) return;
        setAccepting(true);
        try {
            const { data, error: apiError } = await api.post<any>(`/api/invites/${token}/accept`, {});
            if (apiError) {
                toast.error(apiError);
            } else {
                toast.success("Convite aceite com sucesso!");
                router.push("/onboarding");
            }
        } catch (err) {
            toast.error("Falha ao aceitar convite");
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
                <Loader2 className="h-8 w-8 text-white/20 animate-spin mb-4" />
                <p className="text-white/40 font-medium">A validar convite...</p>
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
                    <Building2 className="h-8 w-8 text-rose-500" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2">Convite Inválido</h1>
                <p className="text-white/40 max-w-sm leading-relaxed mb-8">
                    {error || "Este convite expirou ou já foi utilizado."}
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="px-8 h-12 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"
                >
                    Voltar para o Início
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            {/* Animated Background Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-md bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[40px] p-10 shadow-2xl overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-bl-[100px] pointer-events-none border-l border-b border-white/5" />

                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5 mb-8 shadow-xl">
                        {invite.organization.logoUrl ? (
                            <div className="relative w-full h-full rounded-3xl overflow-hidden">
                                <NextImage src={invite.organization.logoUrl} alt="" fill className="object-cover" unoptimized />
                            </div>
                        ) : (
                            <Building2 className="h-10 w-10 text-white/40" />
                        )}
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] font-bold text-white/40 uppercase tracking-widest mb-6">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" />
                        Convite de Organização
                    </div>

                    <h1 className="text-3xl font-black text-white tracking-tight mb-4">
                        Suba a bordo da <span className="text-white">{invite.organization.name}</span>
                    </h1>

                    <p className="text-white/40 leading-relaxed mb-10">
                        Foi convidado para se juntar como <span className="text-white font-bold">{invite.role}</span>.
                        Este acesso permitir-lhe-á gerir eventos e vendas.
                    </p>

                    <div className="w-full space-y-4">
                        <button
                            disabled={accepting}
                            onClick={handleAccept}
                            className="w-full h-14 bg-white text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                        >
                            {accepting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Aceitar Convite
                                    <ArrowRight className="h-4 w-4" strokeWidth={3} />
                                </>
                            )}
                        </button>

                        <p className="text-[11px] font-bold text-white/20 uppercase tracking-[0.2em]">
                            Ao aceitar, concorda com os termos de promotor
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
