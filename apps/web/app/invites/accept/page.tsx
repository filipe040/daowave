"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Building2, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import NextImage from "next/image";
import { useSession, signIn } from "next-auth/react";

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

function InviteAcceptContent() {
    const { data: session, status } = useSession();
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

        if (status === "unauthenticated") {
            signIn(undefined, { callbackUrl: window.location.href });
            return;
        }

        setAccepting(true);
        try {
            const { error: apiError } = await api.post<any>(`/api/invites/${token}/accept`, {});
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

    if (loading || status === "loading") {
        return (
            <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-6">
                <Loader2 className="h-8 w-8 text-neutral-400 animate-spin mb-4" />
                <p className="text-neutral-500 font-medium">A carregar...</p>
            </div>
        );
    }

    if (error || !invite) {
        return (
            <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
                    <Building2 className="h-8 w-8 text-rose-500" />
                </div>
                <h1 className="text-2xl font-black text-neutral-900 mb-2">Convite Inválido</h1>
                <p className="text-neutral-500 max-w-sm leading-relaxed mb-8">
                    {error || "Este convite expirou ou já foi utilizado."}
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="px-8 h-12 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-2xl font-bold transition-all"
                >
                    Voltar para o Início
                </button>
            </div>
        );
    }

    const emailMismatch = session?.user?.email && session.user.email.toLowerCase() !== invite.email.toLowerCase();

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-6">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-md bg-white border border-neutral-200 shadow-md rounded-[40px] p-10 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neutral-50 rounded-bl-[100px] pointer-events-none border-l border-b border-neutral-200" />

                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-neutral-50 flex items-center justify-center border border-neutral-200 mb-8 shadow-xl">
                        {invite.organization.logoUrl ? (
                            <div className="relative w-full h-full rounded-3xl overflow-hidden">
                                <NextImage src={invite.organization.logoUrl} alt="" fill className="object-cover" unoptimized />
                            </div>
                        ) : (
                            <Building2 className="h-10 w-10 text-neutral-500" />
                        )}
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-50 border border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-widest mb-6">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        Convite de Organização
                    </div>

                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight mb-4">
                        Suba a bordo da <span className="text-neutral-900">{invite.organization.name}</span>
                    </h1>

                    <p className="text-neutral-500 leading-relaxed mb-10">
                        Foi convidado para se juntar como <span className="text-neutral-900 font-bold">{invite.role}</span>.
                        Este acesso permitir-lhe-á gerir eventos e vendas.
                    </p>

                    <div className="w-full space-y-4">
                        {emailMismatch ? (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[13px] text-rose-500 font-medium">
                                Este convite foi para <strong>{invite.email}</strong>, mas está logado como <strong>{session?.user?.email}</strong>.
                                <button
                                    onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                                    className="block w-full mt-3 py-2 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors"
                                >
                                    Trocar de Conta
                                </button>
                            </div>
                        ) : (
                            <button
                                disabled={accepting}
                                onClick={handleAccept}
                                className="w-full h-14 bg-violet-600 text-white rounded-2xl font-black text-sm hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-500/25"
                            >
                                {accepting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        {status === "unauthenticated" ? "Login para Aceitar" : "Aceitar Convite"}
                                        <ArrowRight className="h-4 w-4" strokeWidth={3} />
                                    </>
                                )}
                            </button>
                        )}

                        <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
                            Ao aceitar, concorda com os termos de promotor
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function InviteAcceptPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen mesh-gradient flex flex-col items-center justify-center p-6">
                <Loader2 className="h-8 w-8 text-neutral-400 animate-spin mb-4" />
                <p className="text-neutral-500 font-medium">A carregar...</p>
            </div>
        }>
            <InviteAcceptContent />
        </Suspense>
    );
}
