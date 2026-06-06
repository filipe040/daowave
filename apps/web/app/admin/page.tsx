"use client";

import { useEffect, useState } from "react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Euro, Calendar, Users, Building2, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface AdminStats {
    users: number;
    events: number;
    activeOrganizations: number;
    orders: number;
    gmv: number;
}

const fmt = (cents: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = () => {
        setLoading(true); setError(null);
        fetch("/api/admin/stats")
            .then((res) => { if (!res.ok) throw new Error("Unauthorized"); return res.json(); })
            .then((data: AdminStats) => setStats(data))
            .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="min-h-full bg-transparent">
            <div className="bg-neutral-50 border-b border-neutral-200 px-6 sm:px-10 py-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight uppercase">Visão Geral</h1>
                    <p className="mt-1 text-[14px] text-neutral-500">Estado global da plataforma</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 space-y-10">
                {loading && (
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl bg-neutral-50" />)}
                    </div>
                )}
                {!loading && error && <ErrorState message={error} onRetry={load} />}
                {!loading && !error && stats && (
                    <>
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                            <KpiCard label="GMV Total" value={fmt(stats.gmv)} icon={Euro} iconColor="text-emerald-600" />
                            <KpiCard label="Utilizadores" value={stats.users} icon={Users} iconColor="text-blue-600" />
                            <KpiCard label="Organizações" value={stats.activeOrganizations} icon={Building2} iconColor="text-purple-600" />
                            <KpiCard label="Eventos" value={stats.events} icon={Calendar} iconColor="text-orange-600" />
                            <div className="col-span-2 sm:col-span-1">
                                <KpiCard label="Encomendas" value={stats.orders} icon={ShoppingCart} iconColor="text-neutral-500" />
                            </div>
                        </div>

                        {/* Quick nav */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { href: "/admin/users", label: "Utilizadores", desc: "Gerir contas e funções" },
                                { href: "/admin/events", label: "Eventos", desc: "Aprovar e gerir eventos" },
                                { href: "/admin/fraud", label: "Anti-Fraude", desc: "Deteção de padrões suspeitos" },
                                { href: "/admin/system", label: "Sistema", desc: "Logs e erros recentes" },
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="bg-neutral-50 backdrop-blur-xl rounded-2xl border border-neutral-200 p-6 hover:bg-neutral-100 hover:border-neutral-300 transition-all duration-300 group shadow-xl"
                                >
                                    <p className="text-sm font-bold text-neutral-900 group-hover:text-neutral-900 tracking-wide uppercase">{item.label}</p>
                                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{item.desc}</p>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
