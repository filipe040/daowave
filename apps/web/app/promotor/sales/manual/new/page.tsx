"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
    ChevronRight,
    ChevronLeft,
    Calendar,
    Ticket,
    User,
    Wallet,
    CheckCircle2,
    ExternalLink,
    QrCode,
    Download,
    Mail,
    Search
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Event {
    id: string;
    title: string;
    startAt: string;
    venue: string;
    ticketLots: TicketLot[];
}

interface TicketLot {
    id: string;
    name: string;
    priceCents: number;
    quantityTotal: number;
    quantitySold: number;
}

export default function NewManualSalePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [events, setEvents] = useState<Event[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [selectedEventId, setSelectedEventId] = useState("");
    const [selectedLotId, setSelectedLotId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [paidNow, setPaidNow] = useState(true);
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");

    const [successData, setSuccessData] = useState<any>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await api.get<{ events: Event[] }>("/api/promotor/events");
        if (error) setError(error);
        else setEvents(data?.events || []);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const selectedEvent = useMemo(() => events.find(e => e.id === selectedEventId), [events, selectedEventId]);
    const selectedLot = useMemo(() => selectedEvent?.ticketLots.find(l => l.id === selectedLotId), [selectedEvent, selectedLotId]);

    const handleCreate = async () => {
        setSubmitting(true);
        try {
            const idempotencyKey = `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const { data, error } = await api.post("/api/promotor/manual-sales", {
                eventId: selectedEventId,
                ticketLotId: selectedLotId,
                quantity,
                paymentMethod,
                paidNow,
                reference,
                notes,
                customerName,
                customerEmail,
                customerPhone,
                idempotencyKey
            }, { timeout: 8000 });

            if (error) throw new Error(error);

            setSuccessData(data);
            setStep(5);
            toast.success("Venda manual concluída!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <PageShell title="Nova Venda Manual"><Skeleton className="h-96 w-full rounded-2xl bg-neutral-100" /></PageShell>;
    if (error) return <PageShell title="Erro"><ErrorState message={error} onRetry={load} /></PageShell>;

    if (step === 5 && successData) {
        return (
            <PageShell
                title="Venda Concluída"
                subtitle="Os bilhetes foram gerados com sucesso."
                backButton={{ href: "/promotor/sales/manual", label: "Voltar às vendas" }}
            >
                <div className="max-w-2xl mx-auto space-y-8 py-10">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Sucesso!</h2>
                        <p className="text-zinc-500">Lote: {selectedLot?.name} • Qtd: {quantity}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {successData.tickets.map((t: any) => (
                            <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/10 transition-all">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Código do Bilhete</div>
                                    <div className="text-lg font-mono font-bold text-white">{t.code}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`/api/tickets/${t.id}/pdf`}
                                        target="_blank"
                                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                                        title="Download PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <button
                            onClick={() => router.push("/promotor/sales/manual")}
                            className="flex-1 py-4 rounded-2xl text-sm font-bold bg-white/5 text-white hover:bg-white/10 transition-all"
                        >
                            Ver Todas as Vendas
                        </button>
                        <button
                            onClick={() => {
                                setStep(1);
                                setSelectedLotId("");
                                setQuantity(1);
                                setSuccessData(null);
                            }}
                            className="flex-1 py-4 rounded-2xl text-sm font-bold bg-[#00a0e3] text-white hover:bg-[#0090cc] transition-all"
                        >
                            Nova Venda Manual
                        </button>
                    </div>
                </div>
            </PageShell>
        );
    }

    return (
        <PageShell
            title="Nova Venda Manual"
            subtitle="Siga os passos para emitir bilhetes fora do sistema online."
            backButton={{ href: "/promotor/sales/manual", label: "Cancelar" }}
        >
            <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Step Indicators */}
                        <div className="flex items-center gap-4">
                            {[1, 2, 3, 4].map(s => (
                                <div key={s} className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step >= s ? 'bg-[#00a0e3] text-white' : 'bg-white/5 text-zinc-500'}`}>
                                        {s}
                                    </div>
                                    {s < 4 && <div className={`w-8 h-px ${step > s ? 'bg-white' : 'bg-white/5'}`} />}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Select Event */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-zinc-500" /> Selecione o Evento
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {events.map(e => (
                                        <button
                                            key={e.id}
                                            onClick={() => { setSelectedEventId(e.id); setStep(2); }}
                                            className={`p-6 rounded-2xl border text-left transition-all ${selectedEventId === e.id ? 'bg-neutral-100 border-neutral-300' : 'bg-white/5 border-white/10 hover:border-white/10'}`}
                                        >
                                            <div className="font-bold text-white uppercase tracking-tight">{e.title}</div>
                                            <div className="text-sm text-zinc-500 mt-1">{e.venue} • {format(new Date(e.startAt), "d MMM yyyy", { locale: pt })}</div>
                                        </button>
                                    ))}
                                    {events.length === 0 && <p className="text-zinc-500 italic">Nenhum evento ativo disponível.</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Select Ticket & Qty */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <button onClick={() => setStep(1)} className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1">
                                    <ChevronLeft className="w-3 h-3" /> Alterar Evento
                                </button>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Ticket className="w-5 h-5 text-zinc-500" /> Selecione o Bilhete
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedEvent?.ticketLots.map(l => (
                                        <button
                                            key={l.id}
                                            onClick={() => setSelectedLotId(l.id)}
                                            className={`p-6 rounded-2xl border text-left transition-all flex justify-between items-center ${selectedLotId === l.id ? 'bg-neutral-100 border-neutral-300' : 'bg-white/5 border-white/10 hover:border-white/10'}`}
                                        >
                                            <div>
                                                <div className="font-bold text-white uppercase tracking-tight">{l.name}</div>
                                                <div className="text-xs text-zinc-500 mt-1">Disponível: {l.quantityTotal - l.quantitySold}</div>
                                            </div>
                                            <div className="text-lg font-black text-white">{(l.priceCents / 100).toFixed(2)}€</div>
                                        </button>
                                    ))}
                                </div>
                                {selectedLotId && (
                                    <div className="pt-6 border-t border-white/10">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-3">Quantidade</label>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl">-</button>
                                            <span className="text-2xl font-black text-white w-8 text-center">{quantity}</span>
                                            <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl">+</button>
                                        </div>
                                    </div>
                                )}
                                <button
                                    disabled={!selectedLotId}
                                    onClick={() => setStep(3)}
                                    className="w-full py-4 rounded-2xl bg-[#00a0e3] text-white font-bold hover:bg-[#0090cc] disabled:opacity-50 transition-all mt-8"
                                >
                                    Próximo Passso: Dados do Cliente
                                </button>
                            </div>
                        )}

                        {/* Step 3: Global Customer Info */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <button onClick={() => setStep(2)} className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1">
                                    <ChevronLeft className="w-3 h-3" /> Alterar Bilhete
                                </button>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <User className="w-5 h-5 text-zinc-500" /> Dados do Cliente (Opcional)
                                </h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2 ml-1">Nome Completo</label>
                                        <input
                                            value={customerName}
                                            onChange={e => setCustomerName(e.target.value)}
                                            placeholder="Nome do cliente final"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2 ml-1">Email</label>
                                            <input
                                                type="email"
                                                value={customerEmail}
                                                onChange={e => setCustomerEmail(e.target.value)}
                                                placeholder="cliente@email.com"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2 ml-1">Telemóvel</label>
                                            <input
                                                value={customerPhone}
                                                onChange={e => setCustomerPhone(e.target.value)}
                                                placeholder="9xx xxx xxx"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep(4)}
                                    className="w-full py-4 rounded-2xl bg-[#00a0e3] text-white font-bold hover:bg-[#0090cc] transition-all mt-8"
                                >
                                    Próximo Passso: Pagamento
                                </button>
                            </div>
                        )}

                        {/* Step 4: Payment */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                <button onClick={() => setStep(3)} className="text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1">
                                    <ChevronLeft className="w-3 h-3" /> Alterar Dados do Cliente
                                </button>
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Wallet className="w-5 h-5 text-zinc-500" /> Registo de Pagamento
                                </h3>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {['CASH', 'MBWAY', 'BANK', 'OTHER'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setPaymentMethod(m)}
                                            className={`py-4 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all ${paymentMethod === m ? 'bg-[#00a0e3] text-white border-[#00a0e3]' : 'bg-white/5 text-zinc-500 border-white/10 hover:border-white/10'}`}
                                        >
                                            {m === 'CASH' ? 'Dinheiro' : m === 'BANK' ? 'Transf.' : m}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/10 mt-8">
                                    <div>
                                        <div className="font-bold text-white uppercase tracking-tight">O Pagamento já foi recebido?</div>
                                        <div className="text-xs text-zinc-500">Se desativar, a venda ficará como PENDENTE.</div>
                                    </div>
                                    <button
                                        onClick={() => setPaidNow(!paidNow)}
                                        className={`w-14 h-8 rounded-full transition-all relative ${paidNow ? 'bg-emerald-500' : 'bg-neutral-100'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-[#14141f] transition-all ${paidNow ? 'right-1' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-6 pt-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2 ml-1">Referência / Doc. ID (Opcional)</label>
                                        <input
                                            value={reference}
                                            onChange={e => setReference(e.target.value)}
                                            placeholder="Ex: Ref MB WAY ou Num. Talão"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-2 ml-1">Notas Internas</label>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={3}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={submitting}
                                    onClick={handleCreate}
                                    className="w-full py-5 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-sm hover:bg-emerald-600 disabled:opacity-50 transition-all mt-8 flex items-center justify-center gap-3"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    {submitting ? 'A Processar...' : 'Finalizar e Gerar Bilhetes'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Summary Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sticky top-8">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8">Resumo da Venda</h4>

                            <div className="space-y-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Evento</div>
                                    <div className="text-sm font-bold text-white uppercase tracking-tight truncate">{selectedEvent?.title || "Não selecionado"}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Bilhete</div>
                                        <div className="text-sm font-bold text-white uppercase tracking-tight truncate">{selectedLot?.name || "-"}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Custo Total</div>
                                        <div className="text-lg font-black text-white">{selectedLot ? ((selectedLot.priceCents * quantity) / 100).toFixed(2) : "0.00"}€</div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-zinc-500">Quantidade</span>
                                        <span className="text-sm font-bold text-white">{quantity}x</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-zinc-500">Pagamento</span>
                                        <span className="text-xs font-black uppercase text-zinc-200">{paymentMethod}</span>
                                    </div>
                                    {customerName && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-zinc-500">Cliente</span>
                                            <span className="text-xs font-bold text-white truncate max-w-[120px]">{customerName}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {step === 4 && (
                                <div className="mt-10 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-[11px] text-amber-200/60 leading-relaxed font-medium">
                                        Certifique-se que o pagamento foi efetivamente recebido antes de entregar os bilhetes ao cliente.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageShell>
    );
}
