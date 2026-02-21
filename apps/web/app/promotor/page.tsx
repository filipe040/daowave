"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Euro, Ticket, Calendar, ShoppingCart } from "lucide-react";
import Link from "next/link";

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

    const load = () => {
        setLoading(true);
        setError(null);
        fetch("/api/promotor/stats")
            .then((res) => { if (!res.ok) throw new Error("Erro ao carregar"); return res.json(); })
            .then((data) => setStats(data.empty ? null : data))
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="min-h-full bg-[#f5f5f7]">
            {/* Header */}
            <div className="bg-[#f5f5f7] border-b border-gray-200/80 px-6 sm:px-10 py-6">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Overview</h1>
                    <p className="mt-0.5 text-sm text-gray-500">Resumo da sua atividade</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-8">
                {loading && (
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-36 rounded-2xl" />
                        ))}
                    </div>
                )}

                {!loading && error && <ErrorState message={error} onRetry={load} />}

                {!loading && !error && !stats && (
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                            <Calendar className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900 mb-1">Comece a sua jornada</h2>
                        <p className="text-sm text-gray-400 mb-5">Ainda não tem nenhuma organização configurada.</p>
                        <Link
                            href="/promotor/events/new"
                            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                        >
                            Criar primeiro evento
                        </Link>
                    </div>
                )}

                {!loading && !error && stats && (
                    <>
                        {/* KPI grid */}
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            <KpiCard
                                label="Receita Total"
                                value={fmt(stats.revenue.total)}
                                icon={Euro}
                                iconColor="text-emerald-600"
                            />
                            <KpiCard
                                label="Bilhetes Vendidos"
                                value={stats.tickets.sold}
                                subtitle={`de ${stats.tickets.capacity} disponíveis`}
                                icon={Ticket}
                                iconColor="text-blue-600"
                            />
                            <KpiCard
                                label="Eventos Ativos"
                                value={stats.events.active}
                                icon={Calendar}
                                iconColor="text-purple-600"
                            />
                            <KpiCard
                                label="Encomendas"
                                value={stats.orders.total}
                                icon={ShoppingCart}
                                iconColor="text-orange-600"
                            />
                        </div>

                        {/* Quick links */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                            {[
                                { href: "/promotor/events", label: "Ver eventos", desc: "Gerir os seus eventos" },
                                { href: "/promotor/sales", label: "Ver vendas", desc: "Histórico de encomendas" },
                                { href: "/promotor/analytics", label: "Analytics", desc: "Receita dos últimos 30 dias" },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200 group"
                                >
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-gray-700">{item.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
