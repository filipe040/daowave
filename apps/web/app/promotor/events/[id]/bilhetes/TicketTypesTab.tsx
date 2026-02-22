"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Plus, Check, Loader2, AlertCircle, Ticket } from "lucide-react";
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

export default function TicketTypesTab({ eventId }: { eventId: string }) {
    const [types, setTypes] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "", requiresSeat: false, perUserLimit: "" });

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events/${eventId}/ticket-types`, undefined, 8000);
            if (!res.ok) throw new Error("Erro ao carregar tipos de bilhete");
            const data = await res.json();
            setTypes(data.ticketTypes);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : undefined
            };

            const res = await fetchWithTimeout(`/api/promotor/events/${eventId}/ticket-types`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }, 8000);

            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.error || "Erro ao criar tipo");
            }

            toast.success("Tipo de bilhete criado com sucesso");
            setIsFormOpen(false);
            setFormData({ name: "", description: "", requiresSeat: false, perUserLimit: "" });
            await load();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsSubmitting(false);
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
        <div className="flex flex-col h-full bg-white">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Categorias GERAIS</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Defina as secções gerais (ex: Geral, VIP, Mesa).</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Novo Tipo
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Tipo *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Entrada VIP" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Limite por Pessoa</label>
                                <input type="number" min="1" value={formData.perUserLimit} onChange={e => setFormData({ ...formData, perUserLimit: e.target.value })} placeholder="Ex: 4 (Opcional)" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                            <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Inclui 2 bebidas e acesso prioritário" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 outline-none transition-all" />
                        </div>
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={formData.requiresSeat} onChange={e => setFormData({ ...formData, requiresSeat: e.target.value === 'true' })} value="true" className="w-4 h-4 text-gray-900 rounded border-gray-300 focus:ring-gray-900 focus:ring-2" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">Requer seleção de Lugar Marcado no Checkout</span>
                                <span className="text-xs text-gray-500">Marque apenas se este tipo precisar que o cliente escolha um lugar no mapa da sala.</span>
                            </div>
                        </label>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Guardar Categoria
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {types.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                        <Ticket className="h-6 w-6" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">Sem Tipos de Bilhete</h4>
                    <p className="text-sm text-gray-500 mt-1 max-w-sm">Comece por criar uma categoria geral como &quot;Bilhete Simples&quot; ou &quot;Mesa VIP&quot; para associar vários lotes e preços a essa categoria.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 bg-white">
                    {types.map(t => (
                        <div key={t.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    {t.name}
                                    {t.requiresSeat && <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-amber-100 text-amber-800 rounded-md">Lugares Marcados</span>}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">{t.description || "Sem descrição"}</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                <span>Lotes: {t._count?.ticketLots || 0}</span>
                                {t.requiresSeat && <span>Lugares mapeados: {t._count?.seats || 0}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
