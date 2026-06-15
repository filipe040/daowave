"use client";

import { useState } from "react";
import { Download, Mail, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TicketActions({
  ticketId,
  canTransfer,
}: {
  ticketId: string;
  canTransfer: boolean;
}) {
  const [email, setEmail] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [resending, setResending] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setTransferring(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao transferir");
        return;
      }
      toast.success(data.message || "Bilhete transferido");
      setEmail("");
      window.location.reload();
    } catch {
      toast.error("Erro de ligação");
    } finally {
      setTransferring(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/resend`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Erro ao reenviar");
        return;
      }
      toast.success("Email reenviado com sucesso");
    } catch {
      toast.error("Erro de ligação");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mt-4 w-full space-y-3">
      <a
        href={`/api/tickets/${ticketId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
      >
        <Download className="h-4 w-4" />
        Descarregar PDF
      </a>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-60"
      >
        {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Reenviar por email
      </button>

      {canTransfer && (
        <form onSubmit={handleTransfer} className="rounded-xl border border-white/10 bg-[#0c0c12] p-4 space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Transferir bilhete</p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@destinatario.pt"
            className="public-input"
          />
          <button
            type="submit"
            disabled={transferring}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00a0e3] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090cc] disabled:opacity-60"
          >
            {transferring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Transferir
          </button>
        </form>
      )}
    </div>
  );
}
