"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { User, Phone, Check, ArrowRight, Loader2, Sparkles, Building2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // User data
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // Org data (refined if owner)
    const [orgName, setOrgName] = useState("");
    const [orgWebsite, setOrgWebsite] = useState("");

    const handleComplete = async () => {
        setLoading(true);
        try {
            const { error: apiError } = await api.post("/api/onboarding/complete", {
                name,
                phone,
                // In a real scenario, we'd fetch the org ID from the session or a previous step
                // For now, let's just focus on user profile completion
            });

            if (apiError) {
                toast.error(apiError);
            } else {
                toast.success("Perfil configurado!");
                router.push("/promotor"); // Redirect to the promoter dashboard
            }
        } catch (err) {
            toast.error("Erro ao finalizar onboarding");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center p-6 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative w-full max-w-xl">
                {/* Progress bar */}
                <div className="flex gap-2 mb-12 px-2">
                    {[1, 2].map((i) => (
                        <div key={i} className={cn(
                            "h-1 flex-1 rounded-full transition-all duration-500",
                            step >= i ? "bg-violet-600" : "bg-neutral-200"
                        )} />
                    ))}
                </div>

                <div className="bg-white border border-neutral-200 shadow-md rounded-[48px] p-10 sm:p-16 shadow-2xl">
                    {step === 1 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <div className="w-16 h-16 rounded-[24px] bg-violet-600 text-white flex items-center justify-center mb-8 shadow-md shadow-violet-500/20">
                                    <User className="h-8 w-8" strokeWidth={2.5} />
                                </div>
                                <h1 className="text-4xl font-black text-neutral-900 tracking-tight leading-tight">
                                    Vamos configurar o seu perfil.
                                </h1>
                                <p className="text-neutral-500 text-[16px] mt-4 font-medium leading-relaxed">
                                    Diga-nos como gostaria de ser tratado na plataforma.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="public-label ml-1 mb-0">Nome Completo</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-violet-600 transition-colors" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ex: João Silva"
                                            className="w-full h-16 public-input h-16 rounded-3xl pl-14 pr-6 text-neutral-900 text-[17px] font-bold focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-neutral-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="public-label ml-1 mb-0">Telemóvel (Opcional)</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-violet-600 transition-colors" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+351 9xx xxx xxx"
                                            className="w-full h-16 public-input h-16 rounded-3xl pl-14 pr-6 text-neutral-900 text-[17px] font-bold focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-neutral-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => name.length >= 2 ? setStep(2) : toast.error("Insira o seu nome")}
                                className="w-full h-16 bg-violet-600 text-white rounded-3xl font-black text-[15px] hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-md shadow-violet-500/25"
                            >
                                Continuar
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={3} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div>
                                <div className="w-16 h-16 rounded-[24px] bg-emerald-400 text-black flex items-center justify-center mb-8 shadow-xl shadow-emerald-400/20">
                                    <Sparkles className="h-8 w-8" strokeWidth={2.5} />
                                </div>
                                <h1 className="text-4xl font-black text-neutral-900 tracking-tight leading-tight">
                                    Tudo pronto para começar!
                                </h1>
                                <p className="text-neutral-500 text-[16px] mt-4 font-medium leading-relaxed">
                                    Ao clicar em finalizar, terá acesso imediato às ferramentas de promotor.
                                </p>
                            </div>

                            <div className="p-8 border border-neutral-200 bg-neutral-50 rounded-[32px] space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                                        <Check className="h-6 w-6 text-emerald-600" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className="text-neutral-900 font-bold tracking-tight">Vendas em tempo real</div>
                                        <div className="text-neutral-400 text-xs font-medium uppercase tracking-widest">Dashboard Ativado</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center">
                                        <Check className="h-6 w-6 text-emerald-600" strokeWidth={3} />
                                    </div>
                                    <div>
                                        <div className="text-neutral-900 font-bold tracking-tight">Gestão de Equipa</div>
                                        <div className="text-neutral-400 text-xs font-medium uppercase tracking-widest">Colaboração Ativada</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 h-16 border border-neutral-200 text-neutral-500 hover:text-neutral-900 rounded-3xl font-bold transition-all"
                                >
                                    Retroceder
                                </button>
                                <button
                                    disabled={loading}
                                    onClick={handleComplete}
                                    className="flex-[2] h-16 bg-violet-600 text-white rounded-3xl font-black text-[15px] hover:bg-violet-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-md shadow-violet-500/25 disabled:opacity-40"
                                >
                                    {loading ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            Finalizar Configuração
                                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={3} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
