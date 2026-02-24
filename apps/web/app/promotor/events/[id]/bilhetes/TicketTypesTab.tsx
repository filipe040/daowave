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
        <div className="flex flex-col h-full bg-transparent">
            <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between bg-white/[0.02] gap-4">
                <div>
                    <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Categorias GERAIS</h3>
                    <p className="text-xs text-white/50 mt-1">Defina as secções gerais (ex: Geral, VIP, Mesa).</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2.5 rounded-2xl text-[13px] font-bold hover:bg-white/90 shadow-[0_12px_30px_rgba(255,255,255,0.15)] transition-all hover:-translate-y-0.5 active:scale-95 shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    Novo Tipo
                </button>
            </div>

            {isFormOpen && (
                <div className="p-6 sm:p-8 border-b border-white/10 bg-black/40 relative">
                    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2 ml-1">Nome do Tipo *</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Entrada VIP" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner text-[14px]" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2 ml-1">Limite por Pessoa</label>
                                <input type="number" min="1" value={formData.perUserLimit} onChange={e => setFormData({ ...formData, perUserLimit: e.target.value })} placeholder="Ex: 4 (Opcional)" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner text-[14px]" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2 ml-1">Descrição</label>
                            <input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Inclui 2 bebidas e acesso prioritário" className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-5 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all shadow-inner text-[14px]" />
                        </div>
                        <label className="flex items-center gap-4 p-4 border border-white/10 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors mt-2">
                            <input type="checkbox" checked={formData.requiresSeat} onChange={e => setFormData({ ...formData, requiresSeat: e.target.value === 'true' })} value="true" className="w-5 h-5 text-emerald-500 rounded-md border-white/20 bg-white/10 focus:ring-emerald-500 focus:ring-2 focus:ring-offset-black" />
                            <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-emerald-400">Requer seleção de Lugar Marcado no Checkout</span>
                                <span className="text-xs text-white/50 font-medium mt-0.5">Marque apenas se este tipo precisar que o cliente escolha um lugar no mapa da sala.</span>
                            </div>
                        </label>
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-[13px] font-bold text-white/60 hover:text-white transition-colors">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 text-black text-[14px] font-bold rounded-2xl hover:bg-emerald-400 disabled:opacity-50 transition-all shadow-lg hover:-translate-y-0.5 mt-2 sm:mt-0">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Guardar Categoria
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {types.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-5 text-white/30 shadow-inner">
                        <Ticket className="h-7 w-7" />
                    </div>
                    <h4 className="text-[15px] font-bold text-white">Sem Tipos de Bilhete</h4>
                    <p className="text-[13px] text-white/50 mt-2 max-w-sm font-medium leading-relaxed">Comece por criar uma categoria geral como &quot;Bilhete Simples&quot; ou &quot;Mesa VIP&quot; para associar os futuros Lotes de venda a essa categoria.</p>
                </div>
            ) : (
                <div className="divide-y divide-white/10 bg-transparent flex-1">
                    {types.map(t => (
                        <div key={t.id} className="p-4 sm:p-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.02] transition-colors gap-4">
                            <div>
                                <h4 className="text-[14px] font-bold text-white flex items-center gap-3">
                                    {t.name}
                                    {t.requiresSeat && <span className="px-2.5 py-1 text-[9px] uppercase font-black tracking-[0.1em] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">Lugares Marcados</span>}
                                </h4>
                                <p className="text-[13px] text-white/50 mt-1 font-medium">{t.description || "Sem descrição especial."}</p>
                            </div>
                            <div className="flex items-center gap-5 text-[12px] font-bold text-white/40 uppercase tracking-wider bg-black/40 px-4 py-2 rounded-xl border border-white/5 shrink-0">
                                <span>{t._count?.ticketLots || 0} Lotes</span>
                                {t.requiresSeat && <span>• {t._count?.seats || 0} Lugares</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
