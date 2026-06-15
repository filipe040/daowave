"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Plus, Check, Loader2, Pencil, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FeePreview } from "@/components/promotor/FeePreview";

const EMPTY_FORM = {
    name: "", ticketTypeId: "", priceCents: "", capacity: "", startsAt: "", endsAt: "", status: "ACTIVE" as "ACTIVE" | "PAUSED",
};

function toDatetimeLocal(value: string | Date | null | undefined) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TicketLotsTab({ eventId }: { eventId: string }) {
    const [lots, setLots] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [canEdit, setCanEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingLotId, setEditingLotId] = useState<string | null>(null);
    const [minCapacity, setMinCapacity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingLotId, setDeletingLotId] = useState<string | null>(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [organizationId, setOrganizationId] = useState<string | undefined>();

    const loadData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [lotsRes, typesRes, eventRes] = await Promise.all([
                fetchWithTimeout(`/api/promotor/events/${eventId}/ticket-lots`, undefined, 8000),
                fetchWithTimeout(`/api/promotor/events/${eventId}/ticket-types`, undefined, 8000),
                fetchWithTimeout(`/api/promotor/events/${eventId}`, undefined, 8000),
            ]);
            if (!lotsRes.ok || !typesRes.ok) throw new Error("Erro ao carregar dados de lotes/tipos");

            const lotsData = await lotsRes.json();
            const typesData = await typesRes.json();
            const eventData = eventRes.ok ? await eventRes.json() : null;
            setLots(lotsData.ticketLots);
            setTypes(typesData.ticketTypes);
            setCanEdit(!!lotsData.meta?.canEdit);
            if (eventData?.organizationId) setOrganizationId(eventData.organizationId);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { loadData(); }, [loadData]);

    const formatEuros = (cents: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingLotId(null);
        setMinCapacity(1);
        setIsFormOpen(false);
    };

    const startCreate = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const startEdit = (lot: any) => {
        const sold = lot.soldCount ?? lot.quantitySold ?? 0;
        setEditingLotId(lot.id);
        setMinCapacity(Math.max(1, sold));
        setFormData({
            name: lot.name,
            ticketTypeId: lot.ticketTypeId || "",
            priceCents: (lot.priceCents / 100).toFixed(2),
            capacity: String(lot.capacity ?? lot.quantityTotal),
            startsAt: toDatetimeLocal(lot.startsAt || lot.saleStartAt),
            endsAt: toDatetimeLocal(lot.endsAt || lot.saleEndAt),
            status: lot.status === "PAUSED" || !lot.isActive ? "PAUSED" : "ACTIVE",
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                priceCents: Math.round(parseFloat(formData.priceCents.replace(',', '.')) * 100),
                capacity: parseInt(formData.capacity, 10),
                startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
                endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
                ticketTypeId: formData.ticketTypeId || null,
                status: formData.status,
            };

            const url = editingLotId
                ? `/api/promotor/events/${eventId}/ticket-lots/${editingLotId}`
                : `/api/promotor/events/${eventId}/ticket-lots`;
            const method = editingLotId ? "PATCH" : "POST";

            const res = await fetchWithTimeout(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }, 8000);

            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.error || "Erro ao guardar lote");
            }

            toast.success(editingLotId ? "Lote atualizado" : "Lote criado com sucesso");
            resetForm();
            await loadData();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (lot: { id: string; name: string; soldCount?: number; quantitySold?: number }) => {
        const sold = lot.soldCount ?? lot.quantitySold ?? 0;
        if (sold > 0) {
            toast.error("Não é possível apagar um lote com bilhetes vendidos.");
            return;
        }
        if (!confirm(`Apagar o lote "${lot.name}"? Esta ação não pode ser desfeita.`)) return;

        setDeletingLotId(lot.id);
        try {
            const res = await fetchWithTimeout(
                `/api/promotor/events/${eventId}/ticket-lots/${lot.id}`,
                { method: "DELETE" },
                8000
            );
            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.error || "Erro ao apagar lote");
            }
            toast.success("Lote apagado");
            if (editingLotId === lot.id) resetForm();
            await loadData();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro");
        } finally {
            setDeletingLotId(null);
        }
    };

    if (loading) return <div className="p-12 flex justify-center text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    if (error) return <div className="p-12 text-center text-red-500 font-medium">{error}</div>;

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 gap-4">
                <div>
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Lotes & Preços</h3>
                    <p className="text-xs text-zinc-500 mt-1">Controle o inventário (capacidade), preços e janelas de venda de cada lote.</p>
                </div>
                <button
                    onClick={startCreate}
                    className="inline-flex items-center justify-center gap-2 bg-[#00a0e3] text-white hover:bg-[#0090cc] px-4 py-2.5 rounded-2xl text-[13px] font-bold shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar Lote
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 sm:p-8 border-b border-white/10 bg-white/5 relative">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-white">
                            {editingLotId ? "Editar lote" : "Novo lote"}
                        </h4>
                        {editingLotId && !canEdit && (
                            <span className="text-xs text-amber-600">Sem permissão de edição</span>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="col-span-1">
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Tipo pai (Opcional)</label>
                                <select value={formData.ticketTypeId} onChange={e => setFormData({ ...formData, ticketTypeId: e.target.value })} disabled={!!editingLotId && !canEdit} className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white px-5 focus:outline-none focus:ring-1 focus:ring-[#00a0e3]/30 transition-all shadow-inner text-[14px] appearance-none disabled:opacity-50">
                                    <option value="" className="bg-background">Sem categoria</option>
                                    {types.map(t => <option key={t.id} value={t.id} className="bg-background">{t.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1 sm:col-span-2">
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Nome do Lote *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={!!editingLotId && !canEdit} placeholder="Ex: 1ª Fase / Lote Early Bird" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 px-5 focus:outline-none focus:ring-1 focus:ring-[#00a0e3]/30 transition-all shadow-inner text-[14px] disabled:opacity-50" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Preço (€) *</label>
                                <input required type="number" step="0.01" min="0" value={formData.priceCents} onChange={e => setFormData({ ...formData, priceCents: e.target.value })} disabled={!!editingLotId && !canEdit} placeholder="Ex: 15.00" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 px-5 focus:outline-none focus:ring-1 focus:ring-[#00a0e3]/30 transition-all shadow-inner text-[14px] disabled:opacity-50" />
                                <FeePreview priceEuros={formData.priceCents} organizationId={organizationId} />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Capacidade (Stock) *</label>
                                <input required type="number" min={minCapacity} value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} disabled={!!editingLotId && !canEdit} placeholder="Ex: 100" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 px-5 focus:outline-none focus:ring-1 focus:ring-[#00a0e3]/30 transition-all shadow-inner text-[14px] disabled:opacity-50" />
                                {editingLotId && minCapacity > 1 && (
                                    <p className="text-[10px] text-zinc-500 mt-1 ml-1">Mínimo: {minCapacity} (já vendidos)</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Estado</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "PAUSED" })} disabled={!!editingLotId && !canEdit} className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white px-5 text-[14px] disabled:opacity-50">
                                    <option value="ACTIVE" className="bg-background">Ativo</option>
                                    <option value="PAUSED" className="bg-background">Pausado</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Início das Vendas</label>
                                <input type="datetime-local" value={formData.startsAt} onChange={e => setFormData({ ...formData, startsAt: e.target.value })} disabled={!!editingLotId && !canEdit} className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white px-5 focus:outline-none focus:ring-1 focus:ring-[#00a0e3]/30 transition-all shadow-inner text-[14px] disabled:opacity-50" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Fim das Vendas</label>
                                <input type="datetime-local" value={formData.endsAt} onChange={e => setFormData({ ...formData, endsAt: e.target.value })} disabled={!!editingLotId && !canEdit} className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white px-5 focus:outline-none focus:ring-1 focus:ring-[#00a0e3]/30 transition-all shadow-inner text-[14px] disabled:opacity-50" />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-[13px] font-bold text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                            {(!editingLotId || canEdit) && (
                                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-black text-[14px] font-bold rounded-2xl hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg hover:-translate-y-0.5 mt-2 sm:mt-0">
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    {editingLotId ? "Guardar alterações" : "Guardar Lote"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-zinc-500 font-bold bg-white/5">
                            <th className="px-6 py-4 font-bold">Lote / Tipo</th>
                            <th className="px-6 py-4 font-bold text-right">Preço</th>
                            <th className="px-6 py-4 font-bold">Stock (Progresso)</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                            {canEdit && <th className="px-6 py-4 font-bold text-right">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                        {lots.length === 0 ? (
                            <tr>
                                <td colSpan={canEdit ? 5 : 4} className="px-6 py-12 text-center text-[13px] text-zinc-500 font-medium">
                                    Nenhum lote criado.
                                </td>
                            </tr>
                        ) : lots.map(lot => {
                            const sold = lot.soldCount ?? lot.quantitySold ?? 0;
                            const capacity = lot.capacity ?? lot.quantityTotal ?? 0;
                            const percent = capacity > 0 ? (sold / capacity) * 100 : 0;
                            const isEditing = editingLotId === lot.id;

                            return (
                                <tr key={lot.id} className={`hover:bg-white/5 transition-colors ${isEditing ? "bg-emerald-500/5" : ""}`}>
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-white text-[14px]">{lot.name}</div>
                                        <div className="text-[12px] text-zinc-500 mt-1 font-medium">{lot.ticketType?.name || "Geral"}</div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="text-[14px] font-bold text-emerald-600">{formatEuros(lot.priceCents)}</div>
                                    </td>
                                    <td className="px-6 py-5 w-64">
                                        <div className="flex items-center justify-between text-[11px] mb-2 uppercase tracking-wider">
                                            <span className="text-zinc-500 font-bold">Vendidos {sold}</span>
                                            <span className="text-white font-bold">{capacity} max</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden border border-white/10">
                                            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${percent}%` }} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${lot.status === 'ACTIVE' && lot.isActive !== false ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                                            {lot.status === 'ACTIVE' && lot.isActive !== false ? "Ativo" : "Pausado"}
                                        </span>
                                    </td>
                                    {canEdit && (
                                        <td className="px-6 py-5 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => isEditing ? resetForm() : startEdit(lot)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                                >
                                                    {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                                                    {isEditing ? "Fechar" : "Editar"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(lot)}
                                                    disabled={deletingLotId === lot.id || sold > 0}
                                                    title={sold > 0 ? "Lote com vendas — não pode apagar" : "Apagar lote"}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                    {deletingLotId === lot.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                    Apagar
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
