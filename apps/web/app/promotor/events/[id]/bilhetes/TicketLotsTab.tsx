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
        <div className="flex flex-col h-full bg-transparent">
            <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.02] gap-4">
                <div>
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Lotes & Preços</h3>
                    <p className="text-xs text-white/50 mt-1">Controle o inventário (capacidade), preços e janelas de venda de cada lote.</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 rounded-2xl text-[13px] font-bold hover:bg-white/90 shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar Lote
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 sm:p-8 border-b border-white/10 bg-black/40 relative">
                    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="col-span-1">
                                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2 ml-1">Tipo pai (Opcional)</label>
                                <select value={formData.ticketTypeId} onChange={e => setFormData({ ...formData, ticketTypeId: e.target.value })} className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white px-5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner text-[14px] appearance-none">
                                    <option value="" className="bg-zinc-900">Sem categoria</option>
                                    {types.map(t => <option key={t.id} value={t.id} className="bg-zinc-900">{t.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2 ml-1">Nome do Lote *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: 1ª Fase / Lote Early Bird" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner text-[14px]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2 ml-1">Preço (€) *</label>
                                <input required type="number" step="0.01" min="0" value={formData.priceCents} onChange={e => setFormData({ ...formData, priceCents: e.target.value })} placeholder="Ex: 15.00" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner text-[14px]" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2 ml-1">Capacidade (Stock) *</label>
                                <input required type="number" min="1" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} placeholder="Ex: 100" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner text-[14px]" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2 ml-1">Início das Vendas</label>
                                <input type="datetime-local" value={formData.startsAt} onChange={e => setFormData({ ...formData, startsAt: e.target.value })} className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner text-[14px]" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2 ml-1">Fim das Vendas</label>
                                <input type="datetime-local" value={formData.endsAt} onChange={e => setFormData({ ...formData, endsAt: e.target.value })} className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner text-[14px]" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-[13px] font-bold text-white/60 hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-black text-[14px] font-bold rounded-2xl hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg hover:-translate-y-0.5 mt-2 sm:mt-0">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Guardar Lote
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-white/40 font-bold bg-white/[0.02]">
                            <th className="px-6 py-4 font-bold">Lote / Tipo</th>
                            <th className="px-6 py-4 font-bold text-right">Preço</th>
                            <th className="px-6 py-4 font-bold">Stock (Progresso)</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {lots.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-[13px] text-white/50 font-medium">
                                    Nenhum lote criado.
                                </td>
                            </tr>
                        ) : lots.map(lot => {
                            const available = Math.max(0, lot.capacity - lot.soldCount);
                            const percent = lot.capacity > 0 ? (lot.soldCount / lot.capacity) * 100 : 0;

                            return (
                                <tr key={lot.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-white text-[14px]">{lot.name}</div>
                                        <div className="text-[12px] text-white/50 mt-1 font-medium">{lot.ticketType?.name || "Geral"}</div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="text-[14px] font-bold text-emerald-400">{formatEuros(lot.priceCents)}</div>
                                    </td>
                                    <td className="px-6 py-5 w-64">
                                        <div className="flex items-center justify-between text-[11px] mb-2 uppercase tracking-wider">
                                            <span className="text-white/40 font-bold">Vendidos {lot.soldCount}</span>
                                            <span className="text-white font-bold">{lot.capacity} max</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/5">
                                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${percent}%` }} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${lot.status === 'ACTIVE' && lot.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
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
