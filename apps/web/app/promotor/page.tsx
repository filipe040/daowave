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
                            href="/organizer/events/new"
                            className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-white text-black hover:bg-white/90 transition-all shadow-xl shadow-white/5"
                        >
                            Criar primeiro evento
                        </Link>
                    }
                />
            )}
            {!loading && !error && stats && (
                <div className="space-y-10">
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        <KpiCard label="Receita Total" value={fmt(stats.revenue.total)} icon={Euro} iconColor="text-emerald-400" />
                        <KpiCard label="Bilhetes Vendidos" value={stats.tickets.sold} subtitle={`de ${stats.tickets.capacity} disponíveis`} icon={Ticket} iconColor="text-blue-400" />
                        <KpiCard label="Eventos Ativos" value={stats.events.active} icon={Calendar} iconColor="text-purple-400" />
                        <KpiCard label="Encomendas" value={stats.orders.total} icon={ShoppingCart} iconColor="text-orange-400" />
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                        {[
                            { href: "/organizer/events", label: "Ver eventos", desc: "Gerir os seus eventos" },
                            { href: "/organizer/sales", label: "Ver vendas", desc: "Histórico de encomendas" },
                            { href: "/organizer/analytics", label: "Analytics", desc: "Receita dos últimos 30 dias" },
                        ].map((item) => (
                            <Link key={item.href} href={item.href} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 group shadow-xl">
                                <p className="text-sm font-bold text-white group-hover:text-white tracking-wide uppercase">{item.label}</p>
                                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </PageShell>
    );
}
