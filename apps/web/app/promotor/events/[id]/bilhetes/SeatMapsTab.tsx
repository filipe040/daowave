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
        <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-white">

            {!hasMap ? (
                <>
                    <div className="w-16 h-16 bg-blue-50/50 text-blue-500 rounded-3xl flex items-center justify-center mb-5 border border-blue-100 shadow-sm">
                        <MapIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Planta da Sala</h3>
                    <p className="text-sm text-gray-500 max-w-lg mb-8 leading-relaxed">
                        Este evento ainda não tem lugares marcados. Pode importar a planta num ficheiro <strong className="text-gray-700">CSV</strong> contendo as colunas <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px] font-mono">section,row,number,label,ticketType</code>.
                    </p>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
                    >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploading ? "A processar CSV..." : "Importar CSV de Lugares"}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                </>
            ) : (
                <div className="w-full max-w-md bg-gray-50 border border-gray-200/80 rounded-2xl p-6 text-left shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <MapIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Mapa de Lugares Ativo</h4>
                            <p className="text-[11px] text-gray-500 font-medium">Assegure que associou os lotes do tipo &quot;Mesa&quot; ou &quot;Lugar Marcado&quot;.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                            <span className="text-3xl font-bold text-gray-900">{stats.available}</span>
                            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Disponíveis</span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
                            <span className="text-3xl font-bold text-gray-900">{stats.sold}</span>
                            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Vendidos / Bloq</span>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="text-xs font-medium text-gray-500 hover:text-gray-900 underline underline-offset-2 flex items-center gap-1.5"
                        >
                            {uploading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : null}
                            Substituir Mapa via CSV (Atenção: apaga lugares não vendidos)
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                    </div>
                </div>
            )}
        </div>
    );
}
