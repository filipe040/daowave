"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Upload, Loader2, AlertCircle, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";

export default function SeatMapsTab({ eventId }: { eventId: string }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadData = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events/${eventId}/seat-maps`, undefined, 8000);
            if (!res.ok) throw new Error("Erro ao carregar mapa de lugares");
            const data = await res.json();
            setStats(data.stats);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", "Mapa Principal");

        try {
            const res = await fetch(`/api/promotor/events/${eventId}/seat-maps`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const b = await res.json();
                throw new Error(b.error || "Erro ao importar mapa");
            }

            const data = await res.json();
            toast.success(`Mapa importado com sucesso! ${data.totalSeats} lugares criados.`);
            await loadData();
        } catch (err: any) {
            toast.error(err.message, { duration: 6000 });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    if (loading) return <div className="p-12 flex justify-center text-gray-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;

    const hasMap = stats?.total > 0;

    return (
        <div className="space-y-4">
            <div className="mx-6 mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-left text-sm text-amber-200/90">
                <strong className="font-bold text-amber-100">Nota:</strong> o mapa é para gestão interna e check-in.
                A compra online com lugar escolhido ainda não está ativa — venda como entrada geral.
            </div>
        <div className="flex flex-col items-center justify-center p-12 text-center h-[500px] bg-transparent">

            {!hasMap ? (
                <>
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner">
                        <MapIcon className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Planta da Sala</h3>
                    <p className="text-[14px] text-zinc-500 max-w-lg mb-8 leading-relaxed font-medium">
                        Este evento ainda não tem lugares marcados. Pode importar a planta num ficheiro <strong className="text-white">CSV</strong> contendo as colunas <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-[12px] font-mono border border-white/10 text-white">section,row,number,label,ticketType</code>.
                    </p>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center justify-center gap-2 bg-[#00a0e3] text-white hover:bg-[#0090cc] px-6 py-3.5 rounded-2xl text-[14px] font-bold shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 transition-all font-medium"
                    >
                        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                        {uploading ? "A processar CSV..." : "Importar CSV de Lugares"}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                </>
            ) : (
                <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 text-left shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-emerald-500/20 text-emerald-600 rounded-2xl">
                            <MapIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="text-[16px] font-bold text-white">Mapa de Lugares Ativo</h4>
                            <p className="text-[12px] text-zinc-500 font-medium mt-1">Assegure que associou os lotes a um Tipo com &quot;Lugares Marcados&quot;.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-inner flex flex-col items-center justify-center h-28">
                            <span className="text-4xl font-black text-white">{stats.available}</span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-2">Disponíveis</span>
                        </div>
                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-inner flex flex-col items-center justify-center h-28">
                            <span className="text-4xl font-black text-zinc-500">{stats.sold}</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2 text-center">Vendidos / Bloq</span>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="text-[12px] font-bold text-zinc-500 hover:text-white underline underline-offset-4 flex items-center gap-2 transition-colors uppercase tracking-wider"
                        >
                            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : null}
                            Substituir via CSV (Apaga Não Vendidos)
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}
