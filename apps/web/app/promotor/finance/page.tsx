"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DataTable } from "@/components/dashboard/DataTable";
import { KpiGridSkeleton } from "@/components/dashboard/LoadingSkeletons";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { getPromoterFinance, FinanceData } from "@/lib/api-client";
import { Euro, TrendingDown, Banknote, Clock } from "lucide-react";

const fmt = (cents: number, currency = "EUR") =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);

const PAYOUT_STATUS_COLOR: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700",
    PENDING: "bg-amber-50 text-amber-700",
    CANCELLED: "bg-red-50 text-red-600",
};

export default function PromoterFinancePage() {
    const [data, setData] = useState<FinanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        const result = await getPromoterFinance();
        if (result.error) setError(result.error);
        else setData(result.data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const currency = data?.currency ?? "EUR";

    return (
        <PageShell title="Finanças" subtitle="Receita bruta, taxas e pagamentos">
            {loading && <KpiGridSkeleton count={4} />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && data && (
                <div className="space-y-6">
                    {/* KPI Row */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            label="Receita Bruta"
                            value={fmt(data.grossCents, currency)}
                            icon={Euro}
                            iconColor="text-emerald-600"
                            subtitle="Total de encomendas pagas"
                        />
                        <KpiCard
                            label="Taxas"
                            value={fmt(data.feesCents, currency)}
                            icon={TrendingDown}
                            iconColor="text-red-500"
                            subtitle="Comissões da plataforma"
                        />
                        <KpiCard
                            label="Receita Líquida"
                            value={fmt(data.netCents, currency)}
                            icon={Banknote}
                            iconColor="text-blue-600"
                            subtitle="Após dedução de taxas"
                        />
                        <KpiCard
                            label="Pagamentos Pendentes"
                            value={fmt(data.payoutsPendingCents, currency)}
                            icon={Clock}
                            iconColor="text-amber-500"
                            subtitle={`${fmt(data.payoutsPaidCents, currency)} já processados`}
                        />
                    </div>

                    {/* Payout history */}
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 mb-3">Histórico de Pagamentos</h2>
                        <DataTable
                            keyField="id"
                            data={data.payouts}
                            columns={[
                                {
                                    key: "id",
                                    label: "ID",
                                    render: (row) => (
                                        <span className="font-mono text-xs text-gray-400 truncate max-w-[120px] block">
                                            {row.id}
                                        </span>
                                    ),
                                },
                                {
                                    key: "amountCents",
                                    label: "Valor",
                                    render: (row) => (
                                        <span className="font-semibold text-gray-900">
                                            {fmt(row.amountCents, currency)}
                                        </span>
                                    ),
                                },
                                {
                                    key: "status",
                                    label: "Estado",
                                    render: (row) => (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${PAYOUT_STATUS_COLOR[row.status] ?? "bg-gray-100 text-gray-500"}`}>
                                            {row.status === "PAID" ? "Pago" : row.status === "PENDING" ? "Pendente" : row.status}
                                        </span>
                                    ),
                                },
                                {
                                    key: "createdAt",
                                    label: "Data",
                                    render: (row) => (
                                        <span className="text-xs text-gray-400">
                                            {new Date(row.createdAt).toLocaleDateString("pt-PT")}
                                        </span>
                                    ),
                                },
                            ]}
                            emptyTitle="Sem pagamentos"
                            emptyDescription="Ainda não existem pagamentos processados."
                        />
                    </div>
                </div>
            )}
        </PageShell>
    );
}
