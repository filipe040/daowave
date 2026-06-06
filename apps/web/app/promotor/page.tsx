"use client";

import { useEffect, useState, useCallback } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageShell } from "@/components/dashboard/PageShell";
import { KpiGridSkeleton } from "@/components/dashboard/LoadingSkeletons";
import { Euro, Ticket, Calendar, ShoppingCart, TrendingUp, Users, ArrowRight, Edit3, BarChart2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Stats {
    revenue: {
        total: number;
        net: number;
        fees: number;
        today: number;
        recent: number;
    };
    tickets: {
        sold: number;
        capacity: number;
        utilization: number;
        checkinRate: number;
    };
    events: { active: number; total: number };
    orders: { total: number };
    chart: { date: string; revenue: number }[];
    recentEvents: {
        id: string;
        title: string;
        status: string;
        startAt: string;
        city: string;
        _count: { tickets: number };
    }[];
}

const fmt = (cents: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function PromoterDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error: apiErr } = await api.get<Stats>("/api/promotor/stats");
        if (apiErr) {
            setError(apiErr);
        } else {
            setStats(data || null);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const maxChartValue = stats?.chart.reduce((max, d) => Math.max(max, d.revenue), 0) || 1;

    return (
        <PageShell
            title="Overview"
            subtitle="Gira os seus eventos e acompanhe o seu desempenho comercial em tempo real."
            actions={
                <Link
                    href="/promotor/events/new"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold bg-violet-600 text-white hover:bg-violet-700 transition-all active:scale-95 shadow-md"
                >
                    <Calendar className="w-4 h-4" />
                    Novo Evento
                </Link>
            }
        >
            {loading && (
                <div className="space-y-10">
                    <KpiGridSkeleton count={4} />
                    <div className="h-[400px] bg-neutral-50 rounded-[32px] border border-neutral-200 animate-pulse" />
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && !stats && (
                <EmptyState
                    icon={Calendar}
                    title="Bem-vindo ao GoPass"
                    description="Parece que ainda não tem uma organização ou eventos. Comece por criar o seu primeiro evento."
                    action={
                        <Link
                            href="/promotor/events/new"
                            className="inline-flex items-center px-8 py-4 rounded-2xl text-base font-bold bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-md"
                        >
                            Criar primeiro evento
                        </Link>
                    }
                />
            )}

            {!loading && !error && stats && (
                <div className="space-y-12 pb-20">
                    {/* KPI Grid */}
                    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            label="Receita Bruta"
                            value={fmt(stats.revenue.total)}
                            subtitle={`Líquido: ${fmt(stats.revenue.net)}`}
                            icon={Euro}
                            iconColor="text-emerald-600"
                        />
                        <KpiCard
                            label="Bilhetes Vendidos"
                            value={stats.tickets.sold}
                            subtitle={`${stats.tickets.utilization}% de ${stats.tickets.capacity} lugares`}
                            icon={Ticket}
                            iconColor="text-blue-600"
                        />
                        <KpiCard
                            label="Check-in Rate"
                            value={`${stats.tickets.checkinRate}%`}
                            subtitle="Entradas validadas"
                            icon={ShieldCheck}
                            iconColor="text-purple-600"
                        />
                        <KpiCard
                            label="Vendas Hoje"
                            value={fmt(stats.revenue.today)}
                            subtitle="Últimas 24 horas"
                            icon={TrendingUp}
                            iconColor="text-orange-600"
                        />
                    </div>

                    {/* Chart Section */}
                    <div className="rounded-3xl border border-neutral-200 bg-white shadow-md p-8 sm:p-10">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Histórico de Vendas</h3>
                                <p className="text-sm text-neutral-400 mt-1">Volume de faturação nos últimos 30 dias</p>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-[12px] font-bold text-neutral-600">
                                <BarChart2 className="w-4 h-4" />
                                30 DIAS
                            </div>
                        </div>

                        <div className="flex items-end justify-between gap-1 sm:gap-2 h-[240px] px-2">
                            {stats.chart.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                    {/* Tooltip */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[11px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl z-10 scale-90 group-hover:scale-100 origin-bottom">
                                        {fmt(d.revenue * 100)}
                                    </div>

                                    {/* Bar */}
                                    <div
                                        className="w-full max-w-[12px] rounded-full bg-neutral-200 group-hover:bg-violet-400 transition-all duration-500 relative overflow-hidden"
                                        style={{ height: `${Math.max((d.revenue / maxChartValue) * 100, 4)}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Label (only every 5 days or first/last) */}
                                    {(i % 5 === 0 || i === stats.chart.length - 1) && (
                                        <div className="mt-4 text-[9px] font-bold text-neutral-400 uppercase tracking-tighter sm:tracking-normal">
                                            {format(new Date(d.date), "dd MMM", { locale: pt })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Events & Quick Actions */}
                    <div className="grid gap-10 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Eventos Recentes</h3>
                                <Link href="/promotor/events" className="text-[13px] font-bold text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-2">
                                    Ver todos <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            <div className="space-y-3">
                                {stats.recentEvents.map((event) => (
                                    <div key={event.id} className="rounded-3xl border border-neutral-200 bg-white shadow-md p-5 sm:p-6 hover:bg-neutral-100 transition-all group flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-5 min-w-0">
                                            <div className="w-14 h-14 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-[10px] font-black text-neutral-400 uppercase leading-none">{format(new Date(event.startAt), "MMM", { locale: pt })}</span>
                                                <span className="text-xl font-black text-neutral-900">{format(new Date(event.startAt), "dd")}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-neutral-900 truncate text-base group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{event.title}</h4>
                                                <p className="text-[13px] text-neutral-400 mt-0.5">{event.city} • <span className="font-bold text-neutral-500">{event._count.tickets} bilhetes</span></p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${event.status === 'PUBLISHED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                                                }`}>
                                                {event.status === 'PUBLISHED' ? 'Ativo' : 'Rascunho'}
                                            </span>
                                            <Link
                                                href={`/promotor/events/${event.id}`}
                                                className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all active:scale-90"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                                {stats.recentEvents.length === 0 && (
                                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-[24px] p-10 text-center">
                                        <p className="text-neutral-600 font-medium">Nenhum evento criado recentemente.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions / Shortcuts */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-neutral-900 tracking-tight px-2">Acesso Rápido</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { href: "/promotor/events", label: "Gestão de Eventos", desc: "Criar e editar os seus eventos", icon: Calendar, color: "text-blue-600" },
                                    { href: "/promotor/sales", label: "Histórico de Vendas", desc: "Lista detalhada de encomendas", icon: ShoppingCart, color: "text-emerald-600" },
                                    { href: "/promotor/analytics", label: "Analytics Detalhado", desc: "Explorar tendências e métricas", icon: BarChart2, color: "text-purple-600" },
                                    { href: "/promotor/checkin", label: "Controlo de Acessos", desc: "Scanner de bilhetes e logs", icon: Users, color: "text-orange-600" },
                                ].map((item) => (
                                    <Link key={item.href} href={item.href} className="rounded-3xl border border-neutral-200 bg-white shadow-md p-6 hover:bg-neutral-100 hover:border-neutral-300 transition-all group shadow-xl flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[14px] font-bold text-neutral-900 tracking-wide uppercase">{item.label}</p>
                                            <p className="text-[12px] text-neutral-400 mt-0.5 leading-tight">{item.desc}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
