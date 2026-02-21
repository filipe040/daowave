"use client";

import { useState } from "react";
import { Send, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TicketTransferButtonProps {
    ticketId: string;
    ticketStatus: string;
}

export function TicketTransferButton({ ticketId, ticketStatus }: TicketTransferButtonProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const isDisabled = ticketStatus === "USED" || ticketStatus === "CANCELLED";

    async function handleTransfer(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/tickets/${ticketId}/transfer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipientEmail: email.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Erro ao transferir bilhete");
            } else {
                toast.success(data.message || "Bilhete transferido com sucesso!");
                setOpen(false);
                setEmail("");
                router.push("/my-tickets");
            }
        } catch {
            toast.error("Erro de ligação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }

    if (isDisabled) return null;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-[13px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
                <Send className="h-4 w-4" />
                Transferir bilhete
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
                    onClick={(e) => e.target === e.currentTarget && setOpen(false)}
                >
                    <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-zinc-900 p-6 shadow-2xl">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute right-4 top-4 text-white/40 hover:text-white transition"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="text-[18px] font-semibold text-white mb-1">Transferir bilhete</h2>
                        <p className="text-[13px] text-white/50 mb-6">
                            Introduz o email do destinatário. O utilizador deve estar registado na plataforma.
                        </p>

                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label className="block text-[12px] uppercase tracking-wider text-white/40 mb-1.5">
                                    Email do destinatário
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@exemplo.com"
                                    required
                                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[14px] text-white placeholder:text-white/25 focus:border-white/30 focus:outline-none focus:ring-0 transition"
                                />
                            </div>

                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3">
                                <p className="text-[12px] text-amber-400/80">
                                    ⚠️ Esta ação é irreversível. O bilhete será transferido imediatamente.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-semibold text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-white/90"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                {loading ? "A transferir..." : "Confirmar transferência"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
