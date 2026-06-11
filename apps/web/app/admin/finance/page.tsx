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
  Calculator,
  CreditCard,
  Download,
  Percent,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type {
  AdminFinanceDashboard,
  EnterpriseFinancialSettings,
  FinanceChartPoint,
} from "@/lib/finance/types";
import { FinanceChart } from "@/components/admin/FinanceChart";

const fmt = (cents: number, currency = "EUR") =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);

type Tab = "dashboard" | "settings" | "tiers" | "campaigns" | "simulator" | "payment-methods";

interface WithdrawalRow {
  id: string;
  amountCents: number;
  status: string;
  organizationId: string;
  createdAt: string;
}

interface PaymentMethodRow {
  id: string;
  name: string;
  code: string;
  fixedFee: number | string;
  percentageFee: number | string;
  vatPercentage: number | string;
  active: boolean;
}

interface SimulatorResult {
  breakdown: Record<string, string>;
  serviceFeeAdjusted: boolean;
  gatewayFeeCents: number;
  netPlatformProfitCents: number;
  marginPercent: number;
}

const WITHDRAWAL_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  PROCESSING: "A processar",
  PAID: "Pago",
  REJECTED: "Rejeitado",
};

const PAYMENT_METHODS = [
  "MBWAY", "MULTIBANCO", "VISA", "MASTERCARD", "APPLE_PAY", "GOOGLE_PAY",
  "EUROPIX", "PAYSHOP", "SEPA", "PAGAQUI", "PAYSAFECARD",
];

function WithdrawalActions({
  status,
  onApprove,
  onReject,
  onPaid,
  layout = "row",
}: {
  status: string;
  onApprove: () => void;
  onReject: () => void;
  onPaid: () => void;
  layout?: "row" | "stack";
}) {
  const btnBase =
    layout === "stack"
      ? "w-full py-2.5 rounded-xl text-xs font-bold transition-colors"
      : "text-xs px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap";

  if (status === "PENDING") {
    return (
      <div className={layout === "stack" ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-1.5 justify-end"}>
        <button type="button" className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-700`} onClick={onApprove}>
          Aprovar
        </button>
        <button type="button" className={`${btnBase} bg-red-50 text-red-700 border border-red-100 hover:bg-red-100`} onClick={onReject}>
          Rejeitar
        </button>
      </div>
    );
  }
  if (status === "PROCESSING" || status === "APPROVED") {
    return (
      <button type="button" className={`${btnBase} bg-violet-600 text-white hover:bg-violet-700`} onClick={onPaid}>
        Marcar pago
      </button>
    );
  }
  return null;
}

export default function AdminFinancePage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [dashboard, setDashboard] = useState<AdminFinanceDashboard | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [settings, setSettings] = useState<EnterpriseFinancialSettings | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [simTicket, setSimTicket] = useState(20);
  const [simMethod, setSimMethod] = useState("MBWAY");
  const [simOrgId, setSimOrgId] = useState("");
  const [simResult, setSimResult] = useState<SimulatorResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [savingMethodId, setSavingMethodId] = useState<string | null>(null);
  const [chartDays, setChartDays] = useState(30);
  const [chartData, setChartData] = useState<FinanceChartPoint[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [dashRes, wRes, sRes, pmRes, chartRes, tiersRes, campaignsRes, orgsRes] = await Promise.all([
      api.get<AdminFinanceDashboard>("/api/admin/finance?view=dashboard"),
      api.get<{ items: WithdrawalRow[] }>("/api/admin/finance?view=withdrawals&limit=20"),
      api.get<EnterpriseFinancialSettings>("/api/admin/finance?view=settings"),
      api.get<{ items: PaymentMethodRow[] }>("/api/admin/finance/payment-methods"),
      api.get<{ points: FinanceChartPoint[] }>(`/api/admin/finance?view=chart&days=${chartDays}`),
      api.get<{ items: any[] }>("/api/admin/finance/tiers"),
      api.get<{ items: any[] }>("/api/admin/finance/campaigns"),
      api.get<{ organizations: { id: string; name: string }[] }>("/api/admin/organizations?limit=100"),
    ]);
    if (dashRes.error) setError(dashRes.error);
    else {
      setDashboard(dashRes.data);
      setWithdrawals(wRes.data?.items ?? []);
      setSettings(sRes.data);
      setPaymentMethods(pmRes.data?.items ?? []);
      setChartData(chartRes.data?.points ?? []);
      setTiers(tiersRes.data?.items ?? []);
      setCampaigns(campaignsRes.data?.items ?? []);
      setOrganizations(orgsRes.data?.organizations ?? []);
    }
    setLoading(false);
  }, [chartDays]);

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

  const runSimulator = async () => {
    setSimLoading(true);
    const res = await api.post<SimulatorResult>("/api/admin/finance/simulator", {
      ticketPriceEuros: simTicket,
      paymentMethodCode: simMethod,
      organizationId: simOrgId || undefined,
    });
    setSimResult(res.data ?? null);
    setSimLoading(false);
  };

  const savePaymentMethod = async (method: PaymentMethodRow) => {
    setSavingMethodId(method.id);
    await api.put("/api/admin/finance/payment-methods", {
      id: method.id,
      name: method.name,
      fixedFee: Number(method.fixedFee),
      percentageFee: Number(method.percentageFee),
      vatPercentage: Number(method.vatPercentage),
      active: method.active,
    });
    await load();
    setSavingMethodId(null);
  };

  const currency = dashboard?.currency ?? "EUR";
  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  const tabs: { id: Tab; label: string; icon: typeof TrendingUp }[] = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "settings", label: "Configurações", icon: Percent },
    { id: "tiers", label: "Escalões", icon: Banknote },
    { id: "campaigns", label: "Campanhas", icon: Shield },
    { id: "simulator", label: "Simulador", icon: Calculator },
    { id: "payment-methods", label: "Métodos", icon: CreditCard },
  ];

  return (
    <PageShell
      title="Finanças"
      subtitle="Controlo financeiro, simulador anti-prejuízo e métodos de pagamento"
      actions={
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          <a
            href="/api/admin/finance/reports?period=monthly&format=csv"
            className="inline-flex items-center justify-center gap-2 w-full xs:w-auto px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold border border-neutral-200 bg-white hover:bg-neutral-50"
          >
            <Download className="h-4 w-4 shrink-0" />
            Exportar CSV
          </a>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center gap-2 w-full xs:w-auto px-4 py-3 sm:py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            Atualizar
          </button>
        </div>
      }
    >
      <div className="flex gap-1 sm:gap-2 mb-5 sm:mb-6 overflow-x-auto pb-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
              tab === id
                ? "bg-violet-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {loading && <KpiGridSkeleton count={6} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && tab === "simulator" && (
        <div className="dash-card p-4 sm:p-6 space-y-5 max-w-2xl">
          <h2 className="text-lg font-bold text-neutral-900">Simulador financeiro</h2>
          <p className="text-sm text-neutral-500">
            Calcula taxa gateway, lucro líquido e margem. Com taxa dinâmica activa, garante lucro mínimo.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Preço bilhete (€)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                value={simTicket}
                onChange={(e) => setSimTicket(Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Método pagamento</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                value={simMethod}
                onChange={(e) => setSimMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold text-neutral-500 uppercase">Organizador (opcional)</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
                value={simOrgId}
                onChange={(e) => setSimOrgId(e.target.value)}
              >
                <option value="">Global (padrão)</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            disabled={simLoading}
            onClick={runSimulator}
            className="dash-btn-primary w-full sm:w-auto"
          >
            {simLoading ? "A calcular…" : "Simular"}
          </button>
          {simResult && (
            <div className="rounded-2xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
              {Object.entries(simResult.breakdown).map(([key, val]) => (
                <div key={key} className="flex justify-between px-4 py-3 text-sm">
                  <span className="text-neutral-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="font-bold tabular-nums">{val}</span>
                </div>
              ))}
              {simResult.serviceFeeAdjusted && (
                <div className="px-4 py-3 bg-amber-50 text-amber-800 text-xs font-semibold">
                  Taxa de serviço ajustada automaticamente para garantir margem mínima.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && !error && tab === "payment-methods" && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Taxas gateway editáveis — usadas no cálculo anti-prejuízo e no simulador.
          </p>
          <div className="space-y-3 md:hidden">
            {paymentMethods.map((m) => (
              <div key={m.id} className="dash-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{m.name}</span>
                  <span className="text-xs font-mono text-neutral-400">{m.code}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-xs">
                    Fixa (€)
                    <input type="number" step="0.01" className="mt-1 w-full rounded-lg border px-2 py-1.5"
                      value={Number(m.fixedFee)} onChange={(e) => setPaymentMethods((prev) => prev.map((x) => x.id === m.id ? { ...x, fixedFee: e.target.value } : x))} />
                  </label>
                  <label className="block text-xs">
                    % taxa
                    <input type="number" step="0.01" className="mt-1 w-full rounded-lg border px-2 py-1.5"
                      value={Number(m.percentageFee)} onChange={(e) => setPaymentMethods((prev) => prev.map((x) => x.id === m.id ? { ...x, percentageFee: e.target.value } : x))} />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={m.active} onChange={(e) => setPaymentMethods((prev) => prev.map((x) => x.id === m.id ? { ...x, active: e.target.checked } : x))} />
                  Activo
                </label>
                <button type="button" disabled={savingMethodId === m.id} onClick={() => savePaymentMethod(m)}
                  className="w-full py-2 rounded-xl bg-violet-600 text-white text-xs font-bold">
                  {savingMethodId === m.id ? "A guardar…" : "Guardar"}
                </button>
              </div>
            ))}
          </div>
          <div className="hidden md:block dash-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-500">
                  <th className="p-3">Método</th>
                  <th className="p-3">Fixa (€)</th>
                  <th className="p-3">%</th>
                  <th className="p-3">IVA %</th>
                  <th className="p-3">Activo</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {paymentMethods.map((m) => (
                  <tr key={m.id} className="border-b border-neutral-50">
                    <td className="p-3 font-semibold">{m.name} <span className="text-neutral-400 font-mono text-xs ml-1">{m.code}</span></td>
                    <td className="p-3">
                      <input type="number" step="0.01" className="w-20 rounded-lg border px-2 py-1"
                        value={Number(m.fixedFee)} onChange={(e) => setPaymentMethods((prev) => prev.map((x) => x.id === m.id ? { ...x, fixedFee: e.target.value } : x))} />
                    </td>
                    <td className="p-3">
                      <input type="number" step="0.01" className="w-20 rounded-lg border px-2 py-1"
                        value={Number(m.percentageFee)} onChange={(e) => setPaymentMethods((prev) => prev.map((x) => x.id === m.id ? { ...x, percentageFee: e.target.value } : x))} />
                    </td>
                    <td className="p-3">
                      <input type="number" step="0.01" className="w-20 rounded-lg border px-2 py-1"
                        value={Number(m.vatPercentage)} onChange={(e) => setPaymentMethods((prev) => prev.map((x) => x.id === m.id ? { ...x, vatPercentage: e.target.value } : x))} />
                    </td>
                    <td className="p-3">
                      <input type="checkbox" checked={m.active} onChange={(e) => setPaymentMethods((prev) => prev.map((x) => x.id === m.id ? { ...x, active: e.target.checked } : x))} />
                    </td>
                    <td className="p-3">
                      <button type="button" disabled={savingMethodId === m.id} onClick={() => savePaymentMethod(m)}
                        className="text-xs font-bold text-violet-600 hover:text-violet-800">
                        {savingMethodId === m.id ? "…" : "Guardar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && tab === "dashboard" && dashboard && (
        <div className="space-y-5 sm:space-y-8 pb-8">
          <div className="md:hidden grid grid-cols-2 gap-3">
            <div className="col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80">GMV total</p>
              <p className="mt-1 text-2xl font-black text-emerald-900 tabular-nums">{fmt(dashboard.gmvCents, currency)}</p>
              <p className="text-xs text-emerald-700/70 mt-1">{dashboard.ordersPaid} encomendas</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700/80">Lucro líquido</p>
              <p className="mt-1 text-lg font-black text-violet-900 tabular-nums">{fmt(dashboard.netProfitCents, currency)}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800/80">Pendentes</p>
              <p className="mt-1 text-lg font-black text-amber-900 tabular-nums">{fmt(dashboard.withdrawalsPendingCents, currency)}</p>
            </div>
          </div>

          <div className="hidden md:grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <KpiCard label="Receita Total (GMV)" value={fmt(dashboard.gmvCents, currency)} icon={TrendingUp} iconColor="text-emerald-600" subtitle={`${dashboard.ordersPaid} encomendas`} />
            <KpiCard label="Receita LivePass" value={fmt(dashboard.grossRevenueCents, currency)} icon={Banknote} iconColor="text-violet-600" />
            <KpiCard label="Lucro Operacional" value={fmt(dashboard.operationalProfitCents ?? dashboard.netProfitCents, currency)} icon={TrendingUp} iconColor="text-emerald-700" />
            <KpiCard label="Taxas Gateway" value={fmt(dashboard.gatewayFeesCents, currency)} icon={CreditCard} iconColor="text-neutral-600" />
            <KpiCard label="Bilhetes Vendidos" value={String(dashboard.ticketsSold ?? 0)} icon={Percent} iconColor="text-blue-600" />
            <KpiCard label="Eventos Activos" value={String(dashboard.activeEvents ?? 0)} icon={Shield} iconColor="text-blue-600" />
            <KpiCard label="Organizadores" value={String(dashboard.activeOrganizers ?? 0)} icon={Wallet} iconColor="text-neutral-700" />
            <KpiCard label="Em Carteiras" value={fmt(dashboard.walletBalanceCents ?? 0, currency)} icon={Wallet} iconColor="text-amber-600" />
            <KpiCard label="Pendente Liquidação" value={fmt(dashboard.pendingSettlementCents ?? 0, currency)} icon={TrendingDown} iconColor="text-amber-700" />
            <KpiCard label="Fundo Reserva" value={fmt(dashboard.reserveBalanceCents, currency)} icon={Shield} iconColor="text-blue-600" />
            <KpiCard label="Reembolsos" value={fmt(dashboard.refundsCents, currency)} icon={TrendingDown} iconColor="text-red-500" />
            <KpiCard label="Levantamentos" value={fmt(dashboard.withdrawalsPaidCents, currency)} icon={Wallet} iconColor="text-neutral-700" subtitle={`${fmt(dashboard.withdrawalsPendingCents, currency)} pendentes`} />
          </div>

          <div className="dash-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-neutral-900">Evolução financeira</h2>
              <div className="flex gap-1">
                {[7, 30, 90, 365].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setChartDays(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      chartDays === d ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {d === 365 ? "12M" : `${d}D`}
                  </button>
                ))}
              </div>
            </div>
            {chartData.length > 0 ? <FinanceChart data={chartData} /> : <p className="text-sm text-neutral-500">Sem dados para o período.</p>}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
              <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
                Pedidos de levantamento
                {pendingCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
                  </span>
                )}
              </h2>
            </div>
            <DataTable
              keyField="id"
              data={withdrawals}
              mobileCard={(row) => (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-black tabular-nums">{fmt(row.amountCents, currency)}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 font-mono truncate">{row.id.slice(0, 8)}…</div>
                      <div className="text-xs text-neutral-500 mt-1">{new Date(row.createdAt).toLocaleDateString("pt-PT")}</div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-neutral-100 text-neutral-600">
                      {WITHDRAWAL_STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </div>
                  <WithdrawalActions layout="stack" status={row.status}
                    onApprove={() => handleApprove(row.id, "APPROVED")}
                    onReject={() => handleApprove(row.id, "REJECTED")}
                    onPaid={() => handleApprove(row.id, "PAID")} />
                </div>
              )}
              columns={[
                { key: "id", label: "ID", render: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}…</span> },
                { key: "amountCents", label: "Valor", render: (r) => <span className="font-semibold tabular-nums">{fmt(r.amountCents, currency)}</span> },
                { key: "status", label: "Estado", render: (r) => WITHDRAWAL_STATUS_LABEL[r.status] ?? r.status },
                { key: "createdAt", label: "Data", render: (r) => new Date(r.createdAt).toLocaleDateString("pt-PT") },
              ]}
              rowActions={(row) => (
                <WithdrawalActions status={row.status}
                  onApprove={() => handleApprove(row.id, "APPROVED")}
                  onReject={() => handleApprove(row.id, "REJECTED")}
                  onPaid={() => handleApprove(row.id, "PAID")} />
              )}
              emptyTitle="Sem levantamentos"
              emptyDescription="Não existem pedidos de levantamento."
            />
          </div>

        </div>
      )}

      {!loading && !error && tab === "settings" && settings && (
        <div className="dash-card p-4 sm:p-6 space-y-4 max-w-4xl">
          <h2 className="text-lg font-bold">Configurações Financeiras Globais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Modo de cálculo</span>
              <select className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
                value={settings.pricingMode ?? "FORMULA"}
                onChange={(e) => setSettings({ ...settings, pricingMode: e.target.value as "FORMULA" | "TIERED" })}>
                <option value="FORMULA">Fórmula (base + %)</option>
                <option value="TIERED">Escalões</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Taxa base (cêntimos)</span>
              <input type="number" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
                value={settings.serviceFeeFixedCents ?? 50}
                onChange={(e) => setSettings({ ...settings, serviceFeeFixedCents: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Percentagem (%)</span>
              <input type="number" step="0.01" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
                value={settings.serviceFeeValue}
                onChange={(e) => setSettings({ ...settings, serviceFeeValue: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Margem mínima (cêntimos)</span>
              <input type="number" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
                value={settings.minimumServiceFeeCents ?? 149}
                onChange={(e) => setSettings({ ...settings, minimumServiceFeeCents: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Taxa máxima (cêntimos)</span>
              <input type="number" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
                value={settings.maximumServiceFeeCents ?? ""}
                onChange={(e) => setSettings({ ...settings, maximumServiceFeeCents: e.target.value ? Number(e.target.value) : null })} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Reserva operacional (cêntimos)</span>
              <input type="number" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
                value={settings.operationalReserveCents ?? 20}
                onChange={(e) => setSettings({ ...settings, operationalReserveCents: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Arredondamento</span>
              <select className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
                value={settings.roundingMode ?? "END_49_99"}
                onChange={(e) => setSettings({ ...settings, roundingMode: e.target.value as EnterpriseFinancialSettings["roundingMode"] })}>
                <option value="NONE">Nenhum</option>
                <option value="END_49">.49</option>
                <option value="END_99">.99</option>
                <option value="END_49_99">.49 / .99</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Quem paga taxas</span>
              <select className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
                value={settings.defaultFeePaidBy ?? "BUYER"}
                onChange={(e) => setSettings({ ...settings, defaultFeePaidBy: e.target.value as "BUYER" | "ORGANIZER" })}>
                <option value="BUYER">Comprador</option>
                <option value="ORGANIZER">Organizador</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-500 uppercase">Dias libertação saldo</span>
              <input type="number" className="mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm"
                value={settings.pendingReleaseDays}
                onChange={(e) => setSettings({ ...settings, pendingReleaseDays: Number(e.target.value) })} />
            </label>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.absorbPaymentFees ?? true}
                onChange={(e) => setSettings({ ...settings, absorbPaymentFees: e.target.checked })} />
              Absorver taxas de pagamento
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.dynamicServiceFee}
                onChange={(e) => setSettings({ ...settings, dynamicServiceFee: e.target.checked })} />
              Taxa dinâmica (anti-prejuízo)
            </label>
          </div>
          <button type="button" disabled={savingSettings} onClick={saveSettings} className="dash-btn-primary">
            {savingSettings ? "A guardar…" : "Guardar configurações"}
          </button>
        </div>
      )}

      {!loading && !error && tab === "tiers" && (
        <div className="dash-card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold">Escalões de Comissão</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-neutral-500">
                  <th className="p-2">Mín (€)</th>
                  <th className="p-2">Máx (€)</th>
                  <th className="p-2">Taxa fixa (€)</th>
                  <th className="p-2">%</th>
                  <th className="p-2">Activo</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-50">
                    <td className="p-2">{(t.minPriceCents / 100).toFixed(2)}</td>
                    <td className="p-2">{t.maxPriceCents ? (t.maxPriceCents / 100).toFixed(2) : "∞"}</td>
                    <td className="p-2">{(t.fixedFeeCents / 100).toFixed(2)}</td>
                    <td className="p-2">{Number(t.percentageFee)}%</td>
                    <td className="p-2">{t.active ? "Sim" : "Não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && tab === "campaigns" && (
        <div className="dash-card p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-bold">Campanhas Promocionais</h2>
          {campaigns.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma campanha configurada.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-3 rounded-xl border border-neutral-100">
                  <div>
                    <p className="font-bold">{c.name}</p>
                    <p className="text-xs text-neutral-500">
                      {new Date(c.startDate).toLocaleDateString("pt-PT")} — {new Date(c.endDate).toLocaleDateString("pt-PT")}
                      {" · "}{c.discountType}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                    {c.active ? "Activa" : "Inactiva"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
