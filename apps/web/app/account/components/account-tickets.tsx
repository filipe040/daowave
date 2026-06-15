"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, ArrowRightLeft } from "lucide-react";

interface TicketItem {
  id: string;
  code: string;
  checkedInAt: string | null;
  createdAt: string;
  event: { id: string; title: string; startAt: string; endAt: string; slug: string } | null;
  ticketLot: { id: string; name: string; priceCents: number; currency: string } | null;
}

function ticketStatus(t: TicketItem): "VALID" | "USED" | "EXPIRED" | "TRANSFERRED" {
  if (t.checkedInAt) return "USED";
  const eventEnd = t.event?.endAt ? new Date(t.event.endAt).getTime() : 0;
  if (eventEnd > 0 && Date.now() > eventEnd) return "EXPIRED";
  return "VALID";
}

export default function AccountTickets() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/tickets")
      .then((r) => r.json())
      .then((data) => {
        if (data.tickets) setTickets(data.tickets);
        else setError(data.error ?? "Erro ao carregar");
      })
      .catch(() => setError("Erro ao carregar bilhetes"))
      .finally(() => setLoading(false));
  }, []);

  const statusConfig = {
    VALID: { label: "Válido", icon: CheckCircle, className: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" },
    USED: { label: "Utilizado", icon: XCircle, className: "text-zinc-500 border-zinc-600 bg-neutral-100/50" },
    EXPIRED: { label: "Expirado", icon: Clock, className: "text-amber-500 border-amber-500/30 bg-amber-500/10" },
    TRANSFERRED: { label: "Transferido", icon: ArrowRightLeft, className: "text-blue-500 border-blue-500/30 bg-blue-500/10" },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          Bilhetes
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Lista dos teus bilhetes e estado de check-in.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">A carregar…</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : tickets.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-500">Ainda não tens bilhetes.</p>
      ) : (
        <ul className="space-y-4" data-testid="account-tickets-list">
          {tickets.map((t) => {
            const status = ticketStatus(t);
            const config = statusConfig[status];
            const Icon = config.icon;
            return (
              <li key={t.id}>
                <Link
                  href={`/account/tickets/${t.id}`}
                  className="block rounded-3xl border border-white/10 bg-[#14141f] shadow-md p-5 sm:p-6 transition-colors hover:bg-white/5 hover:border-neutral-300 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#00a0e3]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  data-testid={`ticket-card-${t.id}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white text-[17px]">{t.event?.title ?? "Evento"}</p>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {t.ticketLot?.name ?? "Bilhete"} · {t.code}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.className}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-4 pt-4 border-t border-white/10 text-xs text-zinc-500">
                    Comprado em {formatDate(t.createdAt)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
