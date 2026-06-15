"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { DataTable } from "@/components/dashboard/DataTable";
import { ShoppingBag, Plus, Search, Filter, Eye, CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

interface ManualOrder {
    id: string;
    status: string;
    totalCents: number;
    buyerName: string | null;
    buyerEmail: string | null;
    createdAt: string;
    event: { title: string };
    manualPayment: {
        method: string;
        reference: string | null;
    };
    tickets: { id: string; code: string }[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    PAID: { label: "Pago", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    PENDING_MANUAL: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    VOIDED: { label: "Anulado", className: "bg-red-500/10 text-red-500 border-red-500/20" },
};

const PAGE_SIZE = 10;

export default function ManualSalesPage() {
    const [orders, setOrders] = useState<ManualOrder[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error: apiErr } = await api.get<{ orders?: ManualOrder[]; total?: number; pagination: { total: number; pages: number } }>(
            `/api/promotor/manual-sales?page=${page}&limit=${PAGE_SIZE}`
        );
        if (apiErr) {
            setError(apiErr);
        } else {
            setOrders(data?.orders ?? []);
            setTotal(data?.pagination?.total ?? 0);
            setTotalPages(data?.pagination?.pages ?? 1);
        }
        setLoading(false);
    }, [page]);

    useEffect(() => { load(); }, [load]);

    const handleMarkPaid = async (id: string) => {
        try {
            const { error } = await api.patch(`/api/promotor/manual-sales/${id}/mark-paid`, {});
            if (error) throw new Error(error);
            toast.success("Venda marcada como paga");
            load();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleVoid = async (id: string) => {
        if (!confirm("Tem a certeza que deseja anular esta venda? Todos os bilhetes associados ficarão inválidos.")) return;
        try {
            const { error } = await api.patch(`/api/promotor/manual-sales/${id}/void`, {});
            if (error) throw new Error(error);
            toast.success("Venda anulada com sucesso");
            load();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleResend = async (id: string) => {
        toast.promise(api.post(`/api/promotor/manual-sales/${id}/resend`, {}), {
            loading: 'A enviar bilhetes...',
            success: 'Bilhetes enviados por email!',
            error: 'Erro ao enviar bilhetes'
        });
    };

    return (
        <PageShell
            title="Vendas Manuais (POS)"
            subtitle="Registe e gira as vendas efetuadas presencialmente ou fora do site."
            actions={
                <Link
                    href="/promotor/sales/manual/new"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold bg-[#00a0e3] text-white hover:bg-[#0090cc] transition-all active:scale-95 shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    Nova Venda Manual
                </Link>
            }
        >
            <div className="space-y-8">
                <DataTable<ManualOrder>
                    keyField="id"
                    data={orders}
                    loading={loading}
                    error={error}
                    onRetry={load}
                    emptyIcon={ShoppingBag}
                    emptyTitle="Nenhuma venda manual registada"
                    emptyDescription="As vendas efetuadas através do terminal POS aparecerão aqui."
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    onPageChange={setPage}
                    columns={[
                        {
                            key: "createdAt",
                            label: "Data",
                            render: (o) => (
                                <div className="text-[13px] text-zinc-400">
                                    {format(new Date(o.createdAt), "dd MMM HH:mm", { locale: pt })}
                                </div>
                            ),
                        },
                        {
                            key: "event",
                            label: "Evento / Cliente",
                            render: (o) => (
                                <div className="max-w-[200px]">
                                    <div className="font-bold text-white uppercase tracking-tight truncate">{o.event.title}</div>
                                    <div className="text-[11px] text-zinc-500 truncate">{o.buyerName || "Cliente Final"}</div>
                                </div>
                            ),
                        },
                        {
                            key: "payment",
                            label: "Pagamento",
                            render: (o) => (
                                <div>
                                    <div className="font-bold text-white text-sm">{(o.totalCents / 100).toFixed(2)}€</div>
                                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">{o.manualPayment.method}</div>
                                </div>
                            ),
                        },
                        {
                            key: "status",
                            label: "Estado",
                            render: (o) => {
                                const config = STATUS_CONFIG[o.status] || STATUS_CONFIG.PENDING_MANUAL;
                                return (
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${config.className}`}>
                                        {config.label}
                                    </span>
                                );
                            },
                        },
                        {
                            key: "tickets",
                            label: "Bilhetes",
                            render: (o) => (
                                <div className="text-[12px] font-bold text-zinc-500">
                                    {o.tickets.length} bilhete{o.tickets.length !== 1 ? 's' : ''}
                                </div>
                            ),
                        },
                    ]}
                    rowActions={(o) => (
                        <div className="flex items-center gap-2">
                            {o.status === 'PENDING_MANUAL' && (
                                <button
                                    onClick={() => handleMarkPaid(o.id)}
                                    className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 hover:text-emerald-300 hover:bg-emerald-500/20 transition-all active:scale-90"
                                    title="Confirmar Pagamento"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                </button>
                            )}
                            {o.buyerEmail && o.status === 'PAID' && (
                                <button
                                    onClick={() => handleResend(o.id)}
                                    className="p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                                    title="Reenviar Bilhetes"
                                >
                                    <Mail className="w-4 h-4" />
                                </button>
                            )}
                            {o.status !== 'VOIDED' && (
                                <button
                                    onClick={() => handleVoid(o.id)}
                                    className="p-3 rounded-xl bg-red-500/10 border border-red-500/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/20 transition-all active:scale-90"
                                    title="Anular Venda"
                                >
                                    <XCircle className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                />
            </div>
        </PageShell>
    );
}
