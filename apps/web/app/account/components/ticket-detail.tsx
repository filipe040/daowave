"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TicketDetailProps {
  ticket: {
    id: string;
    code: string;
    qrPayload: string;
    checkedInAt: string | null;
    createdAt: string;
    event: { id: string; title: string; slug: string; startAt: string; endAt: string } | null;
    ticketLot: { name: string; priceCents: number; currency: string } | null;
    order: { id: string; createdAt: string; totalCents: number; currency: string } | null;
  };
}

export default function TicketDetail({ ticket }: TicketDetailProps) {
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDownloadPdf = async () => {
    setLoadingPdf(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}/pdf`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error ?? "Erro ao obter PDF");
        return;
      }
      if (data.url) window.open(data.url, "_blank");
      else showToast("error", "URL do PDF não disponível");
    } catch {
      showToast("error", "Erro ao obter PDF");
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleResend = async () => {
    setLoadingResend(true);
    try {
      const res = await fetch(`/api/account/tickets/${ticket.id}/resend`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error ?? "Erro ao reenviar email");
        return;
      }
      showToast("success", data.message ?? "Email será reenviado em breve");
    } catch {
      showToast("error", "Erro ao reenviar email");
    } finally {
      setLoadingResend(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferEmail.trim()) return;
    setTransferLoading(true);
    try {
      const res = await fetch(`/api/account/tickets/${ticket.id}/transfer/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: transferEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast("error", data.error ?? "Erro ao transferir");
        return;
      }
      showToast("success", data.message ?? "Transferência concluída");
      setTransferOpen(false);
      setTransferEmail("");
    } catch {
      showToast("error", "Erro ao transferir bilhete");
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/account/tickets"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Bilhetes
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          {ticket.event?.title ?? "Bilhete"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ticket.ticketLot?.name ?? "Bilhete"} · {ticket.code}
        </p>
      </div>

      {toast && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : "bg-red-500/10 border-red-500/30 text-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Código QR</h2>
        {ticket.qrPayload ? (
          <div className="inline-block rounded-xl border border-zinc-700 bg-white p-4">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qrPayload)}`}
              alt="QR do bilhete"
              className="h-48 w-48"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">QR não disponível.</p>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Ações</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadPdf}
            disabled={loadingPdf}
            data-testid="ticket-download-pdf"
          >
            {loadingPdf ? "A obter…" : "Descarregar PDF"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={loadingResend}
            data-testid="ticket-resend-email"
          >
            {loadingResend ? "A enviar…" : "Reenviar email"}
          </Button>
          {!ticket.checkedInAt && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setTransferOpen(true)}
              data-testid="ticket-transfer-initiate"
            >
              Transferir bilhete
            </Button>
          )}
        </div>
      </section>

      {transferOpen && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="text-base font-semibold text-foreground mb-3">Iniciar transferência</h3>
          <form onSubmit={handleTransfer} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="transfer-email">Email do destinatário</Label>
              <Input
                id="transfer-email"
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="mt-2 border-zinc-700 bg-zinc-950"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={transferLoading} data-testid="ticket-transfer-submit">
                {transferLoading ? "A processar…" : "Transferir"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setTransferOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-muted-foreground">
        <p>Comprado em {formatDate(ticket.createdAt)}</p>
        {ticket.checkedInAt && (
          <p className="mt-2">Utilizado em {formatDate(ticket.checkedInAt)}</p>
        )}
      </section>
    </div>
  );
}
