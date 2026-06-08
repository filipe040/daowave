"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { KpiGridSkeleton } from "@/components/dashboard/LoadingSkeletons";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { DataTable } from "@/components/dashboard/DataTable";
import { api } from "@/lib/api-client";
import {
  Banknote,
  Download,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { AdminFinanceDashboard } from "@/lib/finance/types";

const fmt = (cents: number, currency = "EUR") =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);

interface WithdrawalRow {
  id: string;
  amountCents: number;
  status: string;
  organizationId: string;
  createdAt: string;
}

interface SettingsForm {
  buyerFeePercent: number;
  buyerFeeFixedCents: number;
  platformCommissionPercent: number;
  reserveFundPercent: number;
  minWithdrawalCents: number;
  pendingReleaseDays: number;
  autoApproveWithdrawals: boolean;
}

export default function AdminFinancePage() {
  const [dashboard, setDashboard] = useState<AdminFinanceDashboard | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [settings, setSettings] = useState<SettingsForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [dashRes, wRes, sRes] = await Promise.all([
      api.get<AdminFinanceDashboard>("/api/admin/finance?view=dashboard"),
      api.get<{ items: WithdrawalRow[] }>("/api/admin/finance?view=withdrawals&limit=20"),
      api.get<SettingsForm>("/api/admin/finance?view=settings"),
    ]);
    if (dashRes.error) setError(dashRes.error);
    else {
      setDashboard(dashRes.data);
      setWithdrawals(wRes.data?.items ?? []);
      setSettings(sRes.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: string, status: "APPROVED" | "REJECTED" | "PAID") => {
    await api.patch(`/api/admin/finance/withdrawals/${id}`, { status });
    await load();
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    await api.put("/api/admin/finance", settings);
    setSavingSettings(false);
  };

  const currency = dashboard?.currency ?? "EUR";

  return (
    <PageShell
      title="Finanças"
      subtitle="GMV, receita da plataforma, fundos retidos e levantamentos"
      actions={
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <a
            href="/api/admin/finance/reports?period=monthly&format=csv"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 bg-white hover:bg-neutral-50"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </a>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      }
    >
      {loading && <KpiGridSkeleton count={6} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && dashboard && (
        <div className="space-y-8">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="GMV" value={fmt(dashboard.gmvCents, currency)} icon={TrendingUp} iconColor="text-emerald-600" subtitle={`${dashboard.ordersPaid} encomendas`} />
            <KpiCard label="Receita plataforma" value={fmt(dashboard.platformRevenueCents, currency)} icon={Banknote} iconColor="text-violet-600" />
            <KpiCard label="Fundo reserva" value={fmt(dashboard.reserveBalanceCents, currency)} icon={Shield} iconColor="text-blue-600" />
            <KpiCard label="Reembolsos" value={fmt(dashboard.refundsCents, currency)} icon={TrendingDown} iconColor="text-red-500" />
            <KpiCard label="Chargebacks" value={fmt(dashboard.chargebacksCents, currency)} icon={TrendingDown} iconColor="text-amber-600" />
            <KpiCard label="Levantamentos pagos" value={fmt(dashboard.withdrawalsPaidCents, currency)} icon={Wallet} iconColor="text-neutral-700" subtitle={`${fmt(dashboard.withdrawalsPendingCents, currency)} pendentes`} />
          </div>

          {settings && (
            <div className="dash-card p-6 space-y-4">
              <h2 className="text-lg font-bold text-neutral-900">Configurações financeiras</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(
                  [
                    ["buyerFeePercent", "Taxa comprador (%)", 0.01],
                    ["platformCommissionPercent", "Comissão plataforma (%)", 0.01],
                    ["reserveFundPercent", "Fundo reserva (%)", 0.01],
                    ["buyerFeeFixedCents", "Taxa fixa comprador (cêntimos)", 1],
                    ["minWithdrawalCents", "Mínimo levantamento (cêntimos)", 1],
                    ["pendingReleaseDays", "Dias até saldo disponível", 1],
                  ] as const
                ).map(([key, label, step]) => (
                  <label key={key} className="block">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide">{label}</span>
                    <input
                      type="number"
                      step={step}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      value={settings[key]}
                      onChange={(e) =>
                        setSettings({ ...settings, [key]: Number(e.target.value) })
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.autoApproveWithdrawals}
                  onChange={(e) =>
                    setSettings({ ...settings, autoApproveWithdrawals: e.target.checked })
                  }
                />
                Aprovar levantamentos automaticamente
              </label>
              <button
                type="button"
                disabled={savingSettings}
                onClick={saveSettings}
                className="dash-btn-primary"
              >
                {savingSettings ? "A guardar…" : "Guardar configurações"}
              </button>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-neutral-900 mb-3">Pedidos de levantamento</h2>
            <DataTable
              keyField="id"
              data={withdrawals}
              mobileCard={(row) => (
                <div className="space-y-3">
                  <div className="flex justify-between gap-2">
                    <span className="font-bold">{fmt(row.amountCents, currency)}</span>
                    <span className="text-xs font-bold uppercase text-neutral-500">{row.status}</span>
                  </div>
                  <div className="flex gap-2">
                    {row.status === "PENDING" && (
                      <>
                        <button type="button" className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold" onClick={() => handleApprove(row.id, "APPROVED")}>Aprovar</button>
                        <button type="button" className="flex-1 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-bold" onClick={() => handleApprove(row.id, "REJECTED")}>Rejeitar</button>
                      </>
                    )}
                    {(row.status === "PROCESSING" || row.status === "APPROVED") && (
                      <button type="button" className="w-full py-2 rounded-lg bg-violet-600 text-white text-xs font-bold" onClick={() => handleApprove(row.id, "PAID")}>Marcar pago</button>
                    )}
                  </div>
                </div>
              )}
              columns={[
                { key: "id", label: "ID", render: (r) => <span className="font-mono text-xs truncate block max-w-[100px]">{r.id.slice(0, 8)}…</span> },
                { key: "amountCents", label: "Valor", render: (r) => <span className="font-semibold">{fmt(r.amountCents, currency)}</span> },
                { key: "status", label: "Estado", render: (r) => <span className="text-xs font-bold uppercase">{r.status}</span> },
                { key: "createdAt", label: "Data", render: (r) => new Date(r.createdAt).toLocaleDateString("pt-PT") },
              ]}
              rowActions={(row) => (
                <div className="flex gap-1">
                  {row.status === "PENDING" && (
                    <>
                      <button type="button" className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-bold" onClick={() => handleApprove(row.id, "APPROVED")}>Aprovar</button>
                      <button type="button" className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 font-bold" onClick={() => handleApprove(row.id, "REJECTED")}>Rejeitar</button>
                    </>
                  )}
                  {(row.status === "PROCESSING" || row.status === "APPROVED") && (
                    <button type="button" className="text-xs px-2 py-1 rounded bg-violet-50 text-violet-700 font-bold" onClick={() => handleApprove(row.id, "PAID")}>Pago</button>
                  )}
                </div>
              )}
              emptyTitle="Sem levantamentos"
              emptyDescription="Não existem pedidos de levantamento."
            />
          </div>
        </div>
      )}
    </PageShell>
  );
}
