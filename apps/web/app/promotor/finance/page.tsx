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

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-[#00a0e3]/10 text-[#5ec8f8] border-[#00a0e3]/30",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
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

  const fillMaxWithdraw = () => {
    if (!data) return;
    const max = data.withdrawableCents ?? data.availableCents ?? 0;
    if (max <= 0) return;
    setWithdrawAmount((max / 100).toFixed(2));
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
        <div className="space-y-5 sm:space-y-8 pb-8">
          {/* Destaque mobile — saldo levantável */}
          <div className="lg:hidden rounded-2xl sm:rounded-3xl border border-[#00a0e3]/30 bg-gradient-to-br from-[#00a0e3] to-[#0066aa] p-5 sm:p-6 text-white shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Levantável agora</p>
            <p className="mt-2 text-3xl sm:text-4xl font-black tabular-nums tracking-tight">
              {fmt(withdrawableCents, currency)}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-white/75 leading-relaxed">
              Mínimo {fmt(minWithdrawal, currency)}
              {data.reservedWithdrawalCents ? ` · ${fmt(data.reservedWithdrawalCents, currency)} reservado` : ""}
            </p>
          </div>

          {/* Pedir levantamento — antes dos KPIs no mobile */}
          <div className="dash-card p-4 sm:p-6 space-y-4 order-first lg:order-none">
            <h2 className="text-sm sm:text-base font-bold text-white">Pedir levantamento</h2>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4 space-y-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              <p>
                Podes pedir até <strong className="text-white">{fmt(withdrawableCents, currency)}</strong>
                {" "}(mínimo {fmt(minWithdrawal, currency)}).
              </p>
              {data.pendingCents > 0 && data.availableCents === 0 && (
                <p className="text-amber-700">
                  Inclui vendas recentes em saldo pendente — aprovação pela equipa LivePass.
                </p>
              )}
              {!canWithdraw && data.netCents > 0 && withdrawableCents < minWithdrawal && (
                <p className="text-amber-700">Saldo abaixo do mínimo ou já reservado noutros pedidos.</p>
              )}
              {!canWithdraw && data.netCents === 0 && (
                <p>Ainda não há vendas registadas no sistema financeiro.</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">€</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-xl border border-white/10 pl-9 pr-4 py-3.5 text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#00a0e3]/20 focus:border-[#00a0e3]/50"
                />
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                {canWithdraw && (
                  <button
                    type="button"
                    onClick={fillMaxWithdraw}
                    className="w-full py-3 rounded-xl text-sm font-bold border border-white/10 bg-[#14141f] text-zinc-300 hover:bg-white/5 transition-colors"
                  >
                    Valor máximo
                  </button>
                )}
                <button
                  type="button"
                  disabled={withdrawing || !canWithdraw}
                  onClick={handleWithdraw}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    canWithdraw
                      ? "bg-[#00a0e3] text-white hover:bg-[#0090cc] shadow-md"
                      : "bg-neutral-100 text-zinc-500"
                  } ${!canWithdraw ? "xs:col-span-2" : ""}`}
                >
                  {withdrawing ? "A processar…" : "Pedir levantamento"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Vendas (GMV)" value={fmt(data.grossCents, currency)} icon={Euro} iconColor="text-emerald-600" subtitle={`${data.salesCount} encomendas`} />
            <KpiCard label="Comissões" value={fmt(data.platformFeesCents, currency)} icon={TrendingDown} iconColor="text-red-500" />
            <KpiCard label="Receita líquida" value={fmt(data.netCents, currency)} icon={Banknote} iconColor="text-blue-600" />
            <KpiCard label="Saldo pendente" value={fmt(data.pendingCents, currency)} icon={Clock} iconColor="text-amber-600" subtitle={data.settings?.pendingReleaseDays ? `Libertação após ${data.settings.pendingReleaseDays} dias` : undefined} />
            <KpiCard label="Saldo disponível" value={fmt(data.availableCents, currency)} icon={Wallet} iconColor="text-[#00a0e3]" />
            <KpiCard
              className="hidden lg:flex"
              label="Levantável agora"
              value={fmt(withdrawableCents, currency)}
              icon={Wallet}
              iconColor="text-emerald-600"
              highlight
              subtitle={data.reservedWithdrawalCents ? `${fmt(data.reservedWithdrawalCents, currency)} em pedidos activos` : undefined}
            />
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4">Histórico de levantamentos</h2>
            <DataTable
              keyField="id"
              data={data.withdrawals}
              mobileCard={(row) => (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black text-white tabular-nums">{fmt(row.amountCents, currency)}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {new Date(row.createdAt).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        STATUS_STYLE[row.status] ?? "bg-white/5 text-zinc-400 border-white/10"
                      }`}
                    >
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </div>
                </div>
              )}
              columns={[
                { key: "amountCents", label: "Valor", render: (r) => <span className="font-semibold tabular-nums">{fmt(r.amountCents, currency)}</span> },
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
