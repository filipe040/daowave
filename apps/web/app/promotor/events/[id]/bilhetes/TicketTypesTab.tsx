"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Plus, Check, Loader2, AlertCircle, Ticket, Pencil, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TicketType {
    id: string;
    name: string;
    description: string | null;
    requiresSeat: boolean;
    perUserLimit: number | null;
    status: string;
    _count?: { ticketLots: number; seats: number };
}

const EMPTY_FORM = { name: "", description: "", requiresSeat: false, perUserLimit: "", status: "ACTIVE" as "ACTIVE" | "PAUSED" };

export default function TicketTypesTab({ eventId }: { eventId: string }) {
    const [types, setTypes] = useState<TicketType[]>([]);
    const [canEdit, setCanEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events/${eventId}/ticket-types`, undefined, 8000);
            if (!res.ok) throw new Error("Erro ao carregar tipos de bilhete");
            const data = await res.json();
            setTypes(data.ticketTypes);
            setCanEdit(!!data.meta?.canEdit);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { load(); }, [load]);

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingTypeId(null);
        setIsFormOpen(false);
    };

    const startCreate = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const startEdit = (type: TicketType) => {
        setEditingTypeId(type.id);
        setFormData({
            name: type.name,
            description: type.description || "",
            requiresSeat: type.requiresSeat,
            perUserLimit: type.perUserLimit ? String(type.perUserLimit) : "",
            status: type.status === "PAUSED" ? "PAUSED" : "ACTIVE",
        });
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                requiresSeat: formData.requiresSeat,
                perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit, 10) : null,
                status: formData.status,
            };

            const url = editingTypeId
                ? `/api/promotor/events/${eventId}/ticket-types/${editingTypeId}`
                : `/api/promotor/events/${eventId}/ticket-types`;
            const method = editingTypeId ? "PATCH" : "POST";

            const res = await fetchWithTimeout(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }, 8000);

            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.error || "Erro ao guardar tipo");
            }

            toast.success(editingTypeId ? "Tipo atualizado" : "Tipo de bilhete criado com sucesso");
            resetForm();
            await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (type: TicketType) => {
        const lotCount = type._count?.ticketLots ?? 0;
        const msg = lotCount > 0
            ? `O tipo "${type.name}" tem ${lotCount} lote(s). Remova os lotes primeiro.`
            : `Apagar o tipo "${type.name}"? Esta ação não pode ser desfeita.`;

        if (lotCount > 0) {
            toast.error(msg);
            return;
        }
        if (!confirm(msg)) return;

        setDeletingTypeId(type.id);
        try {
            const res = await fetchWithTimeout(
                `/api/promotor/events/${eventId}/ticket-types/${type.id}`,
                { method: "DELETE" },
                8000
            );
            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.error || "Erro ao apagar tipo");
            }
            toast.success("Tipo de bilhete apagado");
            if (editingTypeId === type.id) resetForm();
            await load();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro");
        } finally {
            setDeletingTypeId(null);
        }
    };

    if (loading) {
        return <div className="p-12 flex flex-col items-center justify-center text-gray-400 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm font-medium">A carregar tipos de bilhete...</p>
        </div>;
    }

    if (error) {
        return <div className="p-12 flex flex-col items-center justify-center text-red-500 space-y-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={load} className="text-xs bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100">Tentar novamente</button>
        </div>;
    }

    return (
        <div className="flex flex-col h-full bg-transparent">
            <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between bg-white/5 gap-4">
                <div>
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Categorias GERAIS</h3>
                    <p className="text-xs text-zinc-500 mt-1">Defina as secções gerais (ex: Geral, VIP, Mesa).</p>
                </div>
                <button
                    onClick={startCreate}
                    className="inline-flex items-center justify-center gap-2 bg-[#00a0e3] text-white hover:bg-[#0090cc] px-4 py-2.5 rounded-2xl text-[13px] font-bold shadow-md transition-all hover:-translate-y-0.5 active:scale-95 shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    Novo Tipo
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 sm:p-8 border-b border-white/10 bg-white/5 relative">
                    <h4 className="text-sm font-bold text-white mb-4">
                        {editingTypeId ? "Editar tipo de bilhete" : "Novo tipo de bilhete"}
                    </h4>
                    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Nome do Tipo *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={!!editingTypeId && !canEdit} placeholder="Ex: Entrada VIP" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 px-5 focus:outline-none focus:ring-1 focus:ring-[#00a0e3]/30 transition-all shadow-inner text-[14px] disabled:opacity-50" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Limite por Pessoa</label>
                                <input type="number" min="1" value={formData.perUserLimit} onChange={e => setFormData({ ...formData, perUserLimit: e.target.value })} disabled={!!editingTypeId && !canEdit} placeholder="Ex: 4 (Opcional)" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 px-5 focus:outline-none focus:ring-1 focus:ring-[#00a0e3]/30 transition-all shadow-inner text-[14px] disabled:opacity-50" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Descrição</label>
                            <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} disabled={!!editingTypeId && !canEdit} placeholder="Inclui 2 bebidas e acesso prioritário" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 px-5 focus:outline-none focus:ring-1 focus:ring-[#00a0e3]/30 transition-all shadow-inner text-[14px] disabled:opacity-50" />
                        </div>
                        {editingTypeId && canEdit && (
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 ml-1">Estado</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "PAUSED" })} className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white px-5 text-[14px]">
                                    <option value="ACTIVE" className="bg-background">Ativo</option>
                                    <option value="PAUSED" className="bg-background">Pausado</option>
                                </select>
                            </div>
                        )}
                        <label className="flex items-center gap-4 p-4 border border-white/10 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors mt-2">
                            <input type="checkbox" checked={formData.requiresSeat} onChange={e => setFormData({ ...formData, requiresSeat: e.target.checked })} disabled={!!editingTypeId && !canEdit} className="w-5 h-5 text-emerald-500 rounded-md border-neutral-300 bg-neutral-100 focus:ring-emerald-500 focus:ring-2 focus:ring-offset-white disabled:opacity-50" />
                            <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-emerald-600">Requer seleção de Lugar Marcado no Checkout</span>
                                <span className="text-xs text-zinc-500 font-medium mt-0.5">Marque apenas se este tipo precisar que o cliente escolha um lugar no mapa da sala.</span>
                            </div>
                        </label>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={resetForm} className="px-5 py-2.5 text-[13px] font-bold text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                            {(!editingTypeId || canEdit) && (
                                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-black text-[14px] font-bold rounded-2xl hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg hover:-translate-y-0.5 mt-2 sm:mt-0">
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    {editingTypeId ? "Guardar alterações" : "Guardar Categoria"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {types.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-5 text-zinc-500 shadow-inner">
                        <Ticket className="h-7 w-7" />
                    </div>
                    <h4 className="text-[15px] font-bold text-white">Sem Tipos de Bilhete</h4>
                    <p className="text-[13px] text-zinc-500 mt-2 max-w-sm font-medium leading-relaxed">Comece por criar uma categoria geral como &quot;Bilhete Simples&quot; ou &quot;Mesa VIP&quot; para associar os futuros Lotes de venda a essa categoria.</p>
                </div>
            ) : (
                <div className="divide-y divide-neutral-200 bg-transparent flex-1">
                    {types.map(t => {
                        const isEditing = editingTypeId === t.id;
                        return (
                            <div key={t.id} className={`p-4 sm:p-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/5 transition-colors gap-4 ${isEditing ? "bg-emerald-500/5" : ""}`}>
                                <div>
                                    <h4 className="text-[14px] font-bold text-white flex items-center gap-3 flex-wrap">
                                        {t.name}
                                        {t.requiresSeat && <span className="px-2.5 py-1 text-[9px] uppercase font-black tracking-[0.1em] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg">Lugares Marcados</span>}
                                        {t.status === "PAUSED" && <span className="px-2.5 py-1 text-[9px] uppercase font-black tracking-[0.1em] bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-lg">Pausado</span>}
                                    </h4>
                                    <p className="text-[13px] text-zinc-500 mt-1 font-medium">{t.description || "Sem descrição especial."}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-5 text-[12px] font-bold text-zinc-500 uppercase tracking-wider bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                                        <span>{t._count?.ticketLots || 0} Lotes</span>
                                        {t.requiresSeat && <span>• {t._count?.seats || 0} Lugares</span>}
                                    </div>
                                    {canEdit && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => isEditing ? resetForm() : startEdit(t)}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                                            >
                                                {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                                                {isEditing ? "Fechar" : "Editar"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(t)}
                                                disabled={deletingTypeId === t.id || (t._count?.ticketLots ?? 0) > 0}
                                                title={(t._count?.ticketLots ?? 0) > 0 ? "Remova os lotes associados primeiro" : "Apagar tipo"}
                                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                {deletingTypeId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                Apagar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
