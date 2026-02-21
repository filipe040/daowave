"use client";

import { useEffect, useState, useCallback } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiGridSkeleton } from "@/components/dashboard/LoadingSkeletons";
import { Euro, Ticket, Calendar, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface Stats {
    revenue: { total: number };
    tickets: { sold: number; capacity: number };
    events: { active: number };
    orders: { total: number };
}

const fmt = (cents: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function PromoterDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/stats");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const data = await res.json() as Stats & { empty?: boolean };
            setStats(data.empty ? null : data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro ao carregar");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <PageShell title="Overview" subtitle="Resumo da sua atividade">
            {loading && <KpiGridSkeleton count={4} />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && !stats && (
                <EmptyState
                    icon={Calendar}
                    title="Comece a sua jornada"
                    description="Ainda não tem atividade registada. Crie o seu primeiro evento."
                    action={
                        <Link
                            href="/promotor/events/new"
                            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                        >
                            Criar primeiro evento
                        </Link>
                    }
                />
            )}
            {!loading && !error && stats && (
                <div className="space-y-6">
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <KpiCard label="Receita Total" value={fmt(stats.revenue.total)} icon={Euro} iconColor="text-emerald-600" />
                        <KpiCard label="Bilhetes Vendidos" value={stats.tickets.sold} subtitle={`de ${stats.tickets.capacity} disponíveis`} icon={Ticket} iconColor="text-blue-600" />
                        <KpiCard label="Eventos Ativos" value={stats.events.active} icon={Calendar} iconColor="text-purple-600" />
                        <KpiCard label="Encomendas" value={stats.orders.total} icon={ShoppingCart} iconColor="text-orange-600" />
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                        {[
                            { href: "/promotor/events", label: "Ver eventos", desc: "Gerir os seus eventos" },
                            { href: "/promotor/sales", label: "Ver vendas", desc: "Histórico de encomendas" },
                            { href: "/promotor/analytics", label: "Analytics", desc: "Receita dos últimos 30 dias" },
                        ].map((item) => (
                            <Link key={item.href} href={item.href} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200 group">
                                <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{item.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </PageShell>
    );
}
