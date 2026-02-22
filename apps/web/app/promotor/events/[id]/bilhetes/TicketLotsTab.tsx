"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Plus, Check, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function TicketLotsTab({ eventId }: { eventId: string }) {
    const [lots, setLots] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "", ticketTypeId: "", priceCents: "", capacity: "", startsAt: "", endsAt: ""
    });

    const loadData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [lotsRes, typesRes] = await Promise.all([
                fetchWithTimeout(`/api/promotor/events/${eventId}/ticket-lots`, undefined, 8000),
                fetchWithTimeout(`/api/promotor/events/${eventId}/ticket-types`, undefined, 8000)
            ]);
            if (!lotsRes.ok || !typesRes.ok) throw new Error("Erro ao carregar dados de lotes/tipos");

            const lotsData = await lotsRes.json();
            const typesData = await typesRes.json();
            setLots(lotsData.ticketLots);
            setTypes(typesData.ticketTypes);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { loadData(); }, [loadData]);

    const formatEuros = (cents: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                priceCents: Math.round(parseFloat(formData.priceCents.replace(',', '.')) * 100),
                capacity: parseInt(formData.capacity, 10),
                startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
                endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : undefined,
                ticketTypeId: formData.ticketTypeId || undefined
            };

            const res = await fetchWithTimeout(`/api/promotor/events/${eventId}/ticket-lots`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }, 8000);

            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.error || "Erro ao criar lote");
            }

            toast.success("Lote criado com sucesso");
            setIsFormOpen(false);
            setFormData({ name: "", ticketTypeId: "", priceCents: "", capacity: "", startsAt: "", endsAt: "" });
            await loadData();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    if (error) return <div className="p-12 text-center text-red-500 font-medium">{error}</div>;

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Lotes & Preços</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Controle o inventário (capacidade), preços e janelas de venda de cada lote.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar Lote
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                    <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo pai (Opcional)</label>
                                <select value={formData.ticketTypeId} onChange={e => setFormData({ ...formData, ticketTypeId: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none pr-8">
                                    <option value="">Sem categoria</option>
                                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Lote *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: 1ª Fase / Lote Early Bird" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Preço (€) *</label>
                                <input required type="number" step="0.01" min="0" value={formData.priceCents} onChange={e => setFormData({ ...formData, priceCents: e.target.value })} placeholder="Ex: 15.00" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Capacidade (Stock) *</label>
                                <input required type="number" min="1" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} placeholder="Ex: 100" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Início das Vendas</label>
                                <input type="datetime-local" value={formData.startsAt} onChange={e => setFormData({ ...formData, startsAt: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Fim das Vendas</label>
                                <input type="datetime-local" value={formData.endsAt} onChange={e => setFormData({ ...formData, endsAt: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar Lote
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-semibold bg-gray-50/50">
                            <th className="px-6 py-3 font-medium">Lote / Tipo</th>
                            <th className="px-6 py-3 font-medium text-right">Preço</th>
                            <th className="px-6 py-3 font-medium">Stock (Progresso)</th>
                            <th className="px-6 py-3 font-medium text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {lots.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                    Nenhum lote criado.
                                </td>
                            </tr>
                        ) : lots.map(lot => {
                            const available = Math.max(0, lot.capacity - lot.soldCount);
                            const percent = lot.capacity > 0 ? (lot.soldCount / lot.capacity) * 100 : 0;

                            return (
                                <tr key={lot.id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900 text-sm">{lot.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{lot.ticketType?.name || "Geral"}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-sm font-medium text-gray-900">{formatEuros(lot.priceCents)}</div>
                                    </td>
                                    <td className="px-6 py-4 w-64">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-500 font-medium">Vendidos {lot.soldCount} de {lot.capacity}</span>
                                            <span className="text-gray-900 font-bold">{available} restam</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-gray-900 h-1.5 transition-all" style={{ width: `${percent}%` }} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${lot.status === 'ACTIVE' && lot.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                            {lot.status === 'ACTIVE' && lot.isActive ? "Ativo" : "Pausado"}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
