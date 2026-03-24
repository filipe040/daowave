"use client";

import { useState, useEffect } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Mail, Send, Users, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminMarketingPage() {
    const router = useRouter();
    const [stats, setStats] = useState<{ totalOptedIn: number } | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    const [subject, setSubject] = useState("");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/marketing");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to load marketing stats", error);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !title.trim() || !content.trim()) return;

        if (!confirm(`Tem a certeza que deseja enviar esta campanha para ${stats?.totalOptedIn || 0} utilizadores?`)) {
            return;
        }

        setSending(true);
        setStatus("idle");

        try {
            const res = await fetch("/api/admin/marketing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, title, content }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Erro ao enviar campanha");
            }

            setStatus("success");
            setSubject("");
            setTitle("");
            setContent("");
        } catch (error: any) {
            setStatus("error");
            setErrorMessage(error.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <PageShell
            title="Campanhas de Marketing"
            subtitle="Envie atualizações e promoções para os utilizadores que autorizaram receber marketing."
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* STAs */}
                <div className="lg:col-span-1">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl sticky top-24">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <Users className="h-6 w-6 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-white/60 text-sm font-medium">Subscritores</h3>
                                <div className="text-3xl font-bold text-white mt-1">
                                    {loadingStats ? (
                                        <Loader2 className="h-6 w-6 animate-spin text-white/20 mt-2" />
                                    ) : (
                                        <span>{stats?.totalOptedIn || 0}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed">
                            Apenas utilizadores que ativaram a opção <strong>&quot;Novidades e ofertas&quot;</strong> nas configurações da conta irão receber estes emails.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSend} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Mail className="h-5 w-5 text-white/50" />
                            Nova Campanha
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1">
                                    Assunto do Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="Ex: Não perca as novidades deste verão!"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1">
                                    Título (Dentro do email) <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                    placeholder="Ex: Agenda de Verão Gopass"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-1">
                                    Conteúdo Original (HTML suportado) <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    required
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    rows={8}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm"
                                    placeholder="<p>Olá,</p><p>Temos dezenas de novos eventos disponíveis! Veja no nosso <a href='https://tickets.daowave.pt'>site</a>.</p>"
                                />
                                <p className="text-[11px] text-white/30 mt-2">
                                    Pode usar tags HTML simples como &lt;b&gt;, &lt;p&gt;, &lt;a href=&quot;...&quot;&gt;, &lt;br&gt;.
                                </p>
                            </div>
                        </div>

                        {status === "success" && (
                            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm">Campanha enviada para a fila de processamento com sucesso!</p>
                            </div>
                        )}

                        {status === "error" && (
                            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                <p className="text-sm">{errorMessage}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10 flex justify-end">
                            <button
                                type="submit"
                                disabled={sending || !stats || stats.totalOptedIn === 0}
                                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/25"
                            >
                                {sending ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> A enviar...</>
                                ) : (
                                    <><Send className="h-4 w-4" /> Enviar Campanha</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PageShell>
    );
}
