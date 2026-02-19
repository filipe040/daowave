"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro, Ticket, Calendar, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
    revenue: { total: number };
    tickets: { sold: number; capacity: number };
    events: { active: number };
    orders: { total: number };
}

export default function PromoterDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/promotor/stats")
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch stats");
                return res.json();
            })
            .then((data) => {
                if (data.empty) {
                    // Handle empty state (no org)
                    setStats(null);
                } else {
                    setStats(data);
                }
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-[250px]" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        </div>;
    }

    if (error) {
        return <div className="p-8 text-red-500">Erro ao carregar dados: {error}</div>;
    }

    // Empty State
    if (!stats) {
        return (
            <div className="p-8">
                <h2 className="text-3xl font-bold tracking-tight mb-4">Bem-vindo</h2>
                <Card>
                    <CardHeader>
                        <CardTitle>Comece a sua jornada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Ainda não tem nenhuma organização configurada.</p>
                        {/* Button to create org would go here */}
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                        <Euro className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(stats.revenue.total / 100)}
                        </div>

                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bilhetes Vendidos</CardTitle>
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.tickets.sold}</div>
                        <p className="text-xs text-muted-foreground">
                            de {stats.tickets.capacity} disponíveis
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.events.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Encomendas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats.orders.total}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts would go here */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Vendas Recentes</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {/* Recharts Component Placeholder */}
                        <div className="h-[200px] w-full flex items-center justify-center bg-gray-50 rounded text-muted-foreground">
                            Gráfico de Vendas
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
