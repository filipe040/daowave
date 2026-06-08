"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { KpiGridSkeleton } from "@/components/dashboard/LoadingSkeletons";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { api } from "@/lib/api-client";
import { Banknote, Clock, Euro, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { PromoterFinanceDashboard } from "@/lib/finance/types";

const fmt = (cents: number, currency = "EUR") =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);

interface PromoterFinanceResponse extends PromoterFinanceDashboard {
  settings?: { minWithdrawalCents: number; pendingReleaseDays?: number };
  withdrawals: Array<{ id: string; amountCents: number; status: string; createdAt: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  PROCESSING: "A processar",
  PAID: "Pago",
  REJECTED: "Rejeitado",
};

export default function PromoterFinancePage() {
  const [data, setData] = useState<PromoterFinanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await api.get<PromoterFinanceResponse>("/api/promotor/finance?view=dashboard");
    if (result.error) setError(result.error);
    else setData(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleWithdraw = async () => {
    const euros = parseFloat(withdrawAmount.replace(",", "."));
    if (Number.isNaN(euros) || euros <= 0) {
      toast.error("Introduz um valor válido");
      return;
    }
    const amountCents = Math.round(euros * 100);
    const min = data?.settings?.minWithdrawalCents ?? 5000;
    if (amountCents < min) {
      toast.error(`O montante mínimo é ${fmt(min, currency)}`);
      return;
    }
    setWithdrawing(true);
    const res = await api.post<{ id: string }>("/api/promotor/finance", { amountCents });
    setWithdrawing(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Pedido de levantamento criado com sucesso");
      setWithdrawAmount("");
      load();
    }
  };

  const currency = data?.currency ?? "EUR";
  const withdrawableCents = data?.withdrawableCents ?? data?.availableCents ?? 0;
  const minWithdrawal = data?.settings?.minWithdrawalCents ?? 5000;
  const canWithdraw = withdrawableCents >= minWithdrawal;

  return (
    <PageShell title="Finanças" subtitle="Vendas, comissões, saldos e levantamentos">
      {loading && <KpiGridSkeleton count={6} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Vendas (GMV)" value={fmt(data.grossCents, currency)} icon={Euro} iconColor="text-emerald-600" subtitle={`${data.salesCount} encomendas`} />
            <KpiCard label="Comissões" value={fmt(data.platformFeesCents, currency)} icon={TrendingDown} iconColor="text-red-500" />
            <KpiCard label="Receita líquida" value={fmt(data.netCents, currency)} icon={Banknote} iconColor="text-blue-600" />
            <KpiCard label="Saldo pendente" value={fmt(data.pendingCents, currency)} icon={Clock} iconColor="text-amber-500" subtitle={data.settings?.pendingReleaseDays ? `Libertação após ${data.settings.pendingReleaseDays} dias` : undefined} />
            <KpiCard label="Saldo disponível" value={fmt(data.availableCents, currency)} icon={Wallet} iconColor="text-violet-600" />
            <KpiCard label="Levantável agora" value={fmt(withdrawableCents, currency)} icon={Wallet} iconColor="text-emerald-600" subtitle={data.reservedWithdrawalCents ? `${fmt(data.reservedWithdrawalCents, currency)} em pedidos activos` : undefined} />
          </div>

          <div className="dash-card p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-neutral-900">Pedir levantamento</h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Mínimo: <strong>{fmt(minWithdrawal, currency)}</strong>
              {" · "}
              Podes pedir até <strong>{fmt(withdrawableCents, currency)}</strong>
              {(data.pendingCents > 0 && data.availableCents === 0) && (
                <span className="block mt-1 text-amber-700">
                  O teu saldo inclui vendas recentes (pendentes). Podes pedir levantamento — a aprovação é feita pela equipa LivePass.
                </span>
              )}
              {!canWithdraw && data.netCents > 0 && withdrawableCents < minWithdrawal && (
                <span className="block mt-1 text-amber-700">
                  Saldo abaixo do mínimo de levantamento ou já reservado noutros pedidos.
                </span>
              )}
              {!canWithdraw && data.netCents === 0 && (
                <span className="block mt-1 text-neutral-600">
                  Ainda não há vendas registadas no sistema financeiro.
                </span>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor (€)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-3 text-sm"
              />
              <button
                type="button"
                disabled={withdrawing || !canWithdraw}
                onClick={handleWithdraw}
                className="dash-btn-primary sm:shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {withdrawing ? "A processar…" : "Pedir levantamento"}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-neutral-900 mb-3">Histórico de levantamentos</h2>
            <DataTable
              keyField="id"
              data={data.withdrawals}
              mobileCard={(row) => (
                <div className="flex justify-between items-center gap-3">
                  <div>
                    <div className="font-bold">{fmt(row.amountCents, currency)}</div>
                    <div className="text-xs text-neutral-400">{new Date(row.createdAt).toLocaleDateString("pt-PT")}</div>
                  </div>
                  <span className="text-xs font-bold uppercase">{STATUS_LABEL[row.status] ?? row.status}</span>
                </div>
              )}
              columns={[
                { key: "amountCents", label: "Valor", render: (r) => <span className="font-semibold">{fmt(r.amountCents, currency)}</span> },
                { key: "status", label: "Estado", render: (r) => STATUS_LABEL[r.status] ?? r.status },
                { key: "createdAt", label: "Data", render: (r) => new Date(r.createdAt).toLocaleDateString("pt-PT") },
              ]}
              emptyTitle="Sem levantamentos"
              emptyDescription="Ainda não pediste nenhum levantamento."
            />
          </div>
        </div>
      )}
    </PageShell>
  );
}
