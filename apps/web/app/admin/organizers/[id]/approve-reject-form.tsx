"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrganizerStatus } from "@prisma/client";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  promoterId: string;
  currentStatus: OrganizerStatus;
}

export function ApproveRejectForm({ promoterId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApprove = async () => {
    if (!confirm("Tem certeza que deseja aprovar este promotor?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/organizers/${promoterId}/approve`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Erro ao aprovar");

      router.refresh();
    } catch (error) {
      alert("Erro ao aprovar promotor");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Por favor, forneça um motivo para a rejeição");
      return;
    }

    if (!confirm("Tem certeza que deseja rejeitar este promotor?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/organizers/${promoterId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (!res.ok) throw new Error("Erro ao rejeitar");

      router.refresh();
    } catch (error) {
      alert("Erro ao rejeitar promotor");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "APPROVED") {
    return (
      <div className="text-center p-4 md:p-6 rounded-xl bg-green-500/10 border border-green-500/30">
        <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-400" strokeWidth={1.5} />
        <div className="text-green-400 text-base md:text-lg font-semibold mb-1">Promotor Aprovado</div>
        <div className="text-sm md:text-base text-zinc-400">
          {new Date().toLocaleDateString("pt-PT")}
        </div>
      </div>
    );
  }

  if (currentStatus === "REJECTED") {
    return (
      <div className="text-center p-4 md:p-6 rounded-xl bg-red-500/10 border border-red-500/30">
        <XCircle className="mx-auto mb-2 h-8 w-8 text-red-400" strokeWidth={1.5} />
        <div className="text-red-400 text-base md:text-lg font-semibold">Promotor Rejeitado</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-4 rounded-xl text-base md:text-lg font-semibold transition-all shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processando...
          </span>
        ) : (
          <><CheckCircle className="mr-2 inline h-5 w-5" strokeWidth={1.5} /> Aprovar Promotor</>
        )}
      </button>

      <div className="space-y-3 md:space-y-4 pt-4 border-t border-zinc-700/50">
        <label className="block text-base md:text-lg font-semibold text-zinc-300">
          Motivo da Rejeição (obrigatório)
        </label>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Ex: Documentação incompleta..."
          className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
          rows={4}
        />
        <button
          onClick={handleReject}
          disabled={loading || !rejectionReason.trim()}
          className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-6 py-4 rounded-xl text-base md:text-lg font-semibold transition-all shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Processando...
            </span>
          ) : (
            <><XCircle className="mr-2 inline h-5 w-5" strokeWidth={1.5} /> Rejeitar Promotor</>
          )}
        </button>
      </div>
    </div>
  );
}

