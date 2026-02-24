"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, Building2, Camera, X } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface Org { id: string; name: string; role: string }
interface Event { id: string; title: string }

interface CheckinResult {
    success?: boolean;
    error?: string;
    message?: string;
    checkedInAt?: string;
    checkedInByName?: string;
    ticket?: { id: string; holder?: string; type?: string };
}

type ResultState =
    | { kind: "success"; ticket: CheckinResult["ticket"]; message: string }
    | { kind: "duplicate"; message: string; at: string; by: string | null }
    | { kind: "error"; message: string };

const inputCls = "w-full rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-colors backdrop-blur-xl";
const labelCls = "block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2";

export default function PromoterCheckinPage() {
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [orgId, setOrgId] = useState("");
    const [events, setEvents] = useState<Event[]>([]);
    const [eventId, setEventId] = useState("");
    const [qrCode, setQrCode] = useState("");
    const [loadingOrgs, setLoadingOrgs] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [checking, setChecking] = useState(false);
    const [orgError, setOrgError] = useState<string | null>(null);
    const [result, setResult] = useState<ResultState | null>(null);

    // Camera State
    const [scanning, setScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const scannerRef = useRef<any>(null);
    const isScanningRef = useRef(false);

    const loadOrgs = useCallback(async () => {
        setLoadingOrgs(true); setOrgError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/organizations");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { data: Org[] };
            const data = json.data ?? [];
            setOrgs(data);
            if (data.length === 1) setOrgId(data[0].id);
        } catch (err: unknown) { setOrgError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoadingOrgs(false); }
    }, []);

    const loadEvents = useCallback(async () => {
        if (!orgId) return;
        setLoadingEvents(true);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events?orgId=${orgId}&page=1`);
            if (!res.ok) throw new Error();
            const json = await res.json() as { events?: Event[] };
            setEvents(json.events ?? []);
        } catch { setEvents([]); }
        finally { setLoadingEvents(false); }
    }, [orgId]);

    useEffect(() => { loadOrgs(); }, [loadOrgs]);
    useEffect(() => { if (orgId) loadEvents(); }, [orgId, loadEvents]);

    const executeCheckin = useCallback(async (codeToVerify: string) => {
        if (!eventId || !codeToVerify.trim()) return;
        setChecking(true); setResult(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/checkin/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrCode: codeToVerify.trim(), eventId, deviceId: null }),
            });
            const json = await res.json() as CheckinResult;
            if (json.success) {
                setResult({ kind: "success", ticket: json.ticket, message: json.message ?? "Bilhete válido!" });
            } else if (json.checkedInAt) {
                setResult({ kind: "duplicate", message: json.message ?? "Bilhete já utilizado", at: json.checkedInAt, by: json.checkedInByName ?? null });
            } else {
                setResult({ kind: "error", message: json.error ?? json.message ?? "Bilhete inválido" });
            }
        } catch (err: unknown) {
            setResult({ kind: "error", message: err instanceof Error ? err.message : "Erro de ligação" });
        } finally {
            setChecking(false);
            setQrCode(""); // clear field
        }
    }, [eventId]);

    const handleVerifyForm = async (e: React.FormEvent) => {
        e.preventDefault();
        await executeCheckin(qrCode);
    };

    // --- Camera Logic ---
    const stopScanner = useCallback(async () => {
        if (scannerRef.current && isScanningRef.current) {
            try { await scannerRef.current.stop(); } catch (e) { }
            isScanningRef.current = false;
        }
        scannerRef.current = null;
    }, []);

    useEffect(() => {
        if (!scanning || typeof window === "undefined") return;
        const initScanner = async () => {
            setCameraError(null);
            try {
                const { Html5Qrcode } = await import("html5-qrcode");
                // Need a slight delay to ensure div is rendered before attaching
                setTimeout(async () => {
                    try {
                        const scanner = new Html5Qrcode("dashboard-reader");
                        scannerRef.current = scanner;
                        isScanningRef.current = false;
                        await scanner.start(
                            { facingMode: "environment" },
                            { fps: 10, qrbox: { width: 250, height: 250 } },
                            (decodedText: string) => {
                                // Stop on success to process the result
                                setScanning(false);
                                executeCheckin(decodedText);
                            },
                            () => { } // ignore frequent scan failures
                        );
                        isScanningRef.current = true;
                    } catch (startErr: any) {
                        setCameraError("Erro ao iniciar câmara. Verifique as permissões.");
                        setScanning(false);
                    }
                }, 100);
            } catch (err) {
                setCameraError("Erro a carregar módulo de câmara.");
                setScanning(false);
            }
        };

        initScanner();
        return () => { stopScanner(); };
    }, [scanning, executeCheckin, stopScanner]);

    if (!loadingOrgs && orgError) return <PageShell title="Check-in"><ErrorState message={orgError} onRetry={loadOrgs} /></PageShell>;
    if (!loadingOrgs && orgs.length === 0) return (
        <PageShell title="Check-in">
            <EmptyState icon={Building2} title="Sem organização" description="Para fazer check-in precisa de pertencer a uma organização." />
        </PageShell>
    );

    return (
        <>
            <PageShell title="Check-in" subtitle="Validação de bilhetes">
                <div className="max-w-xl space-y-4">
                    {/* Context selectors */}
                    <div className="bg-white/5 backdrop-blur-2xl rounded-[24px] border border-white/10 shadow-2xl divide-y divide-white/5">
                        {orgs.length > 1 && (
                            <div className="px-6 py-5">
                                <label className={labelCls}>Organização</label>
                                <select className={inputCls} style={{ backgroundColor: '#111' }} value={orgId} onChange={(e) => { setOrgId(e.target.value); setEventId(""); setResult(null); }}>
                                    <option value="">Selecionar…</option>
                                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="px-6 py-5">
                            <label className={labelCls}>Evento</label>
                            {loadingEvents
                                ? <div className="h-[50px] bg-white/5 rounded-2xl border border-white/10 animate-pulse" />
                                : (
                                    <select className={inputCls} style={{ backgroundColor: '#111' }} value={eventId} onChange={(e) => { setEventId(e.target.value); setResult(null); }} disabled={!orgId}>
                                        <option value="">{orgId ? "Selecionar evento…" : "Selecionar organização primeiro"}</option>
                                        {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                                    </select>
                                )}
                        </div>
                    </div>

                    {/* Scan form */}
                    <div className="bg-white/5 backdrop-blur-2xl rounded-[24px] border border-white/10 shadow-2xl overflow-hidden mt-6">
                        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                                    <QrCode className="h-5 w-5 text-white/70" strokeWidth={2} />
                                </div>
                                <h2 className="text-[15px] font-bold text-white tracking-wide">Código do bilhete</h2>
                            </div>
                            <button
                                type="button"
                                disabled={!eventId}
                                onClick={() => setScanning(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[13px] rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <Camera className="w-4 h-4" />
                                Ler QR (Câmara)
                            </button>
                        </div>
                        <form onSubmit={handleVerifyForm} className="px-6 py-6 space-y-6">
                            <div>
                                <label className={labelCls}>QR Code / Código automático</label>
                                <input
                                    autoFocus
                                    placeholder="Ler QR ou inserir código…"
                                    value={qrCode}
                                    onChange={(e) => setQrCode(e.target.value)}
                                    className={`${inputCls} font-mono`}
                                    disabled={!eventId}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={checking || !eventId || !qrCode.trim()}
                                className="w-full inline-flex items-center justify-center gap-2 h-[50px] rounded-2xl text-[14px] font-bold bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl active:scale-95"
                            >
                                {checking ? "A validar…" : "Validar bilhete"}
                            </button>
                        </form>
                    </div>

                    {/* Result */}
                    {result && (
                        <div className={`rounded-[24px] border backdrop-blur-xl shadow-2xl p-6 sm:p-8 mt-6 transition-all ${result.kind === "success" ? "bg-emerald-500/10 border-emerald-500/20" : result.kind === "duplicate" ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                            <div className="flex items-start gap-4 sm:gap-5">
                                <div className={`p-3 rounded-2xl border shrink-0 ${result.kind === "success" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : result.kind === "duplicate" ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-red-500/20 border-red-500/30 text-red-400"}`}>
                                    {result.kind === "success" && <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />}
                                    {result.kind === "duplicate" && <AlertTriangle className="h-6 w-6" strokeWidth={2.5} />}
                                    {result.kind === "error" && <XCircle className="h-6 w-6" strokeWidth={2.5} />}
                                </div>

                                <div className="space-y-1.5 min-w-0 pt-1">
                                    <p className={`text-[16px] font-bold uppercase tracking-wide ${result.kind === "success" ? "text-emerald-400" : result.kind === "duplicate" ? "text-amber-400" : "text-red-400"}`}>
                                        {result.kind === "success" ? "Bilhete válido" : result.kind === "duplicate" ? "Bilhete já utilizado" : "Bilhete inválido"}
                                    </p>
                                    <p className="text-[14px] font-medium text-white/80">{result.message}</p>
                                    {result.kind === "success" && result.ticket && (
                                        <div className="text-[13px] text-white/60 space-y-1 pt-3 border-t border-white/10 mt-3">
                                            {result.ticket.holder && <p><span className="font-bold text-white/40 uppercase tracking-widest text-[10px] mr-2">Titular</span> <span className="text-white">{result.ticket.holder}</span></p>}
                                            {result.ticket.type && <p><span className="font-bold text-white/40 uppercase tracking-widest text-[10px] mr-2">Tipo</span> {result.ticket.type}</p>}
                                        </div>
                                    )}
                                    {result.kind === "duplicate" && (
                                        <p className="text-[12px] text-amber-500/70 pt-2 font-medium">
                                            Utilizado em {new Date(result.at).toLocaleString("pt-PT")}
                                            {result.by && ` por ${result.by}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Camera Scanner Modal inside the PageShell */}
                    {scanning && (
                        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
                            <button
                                onClick={() => setScanning(false)}
                                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="w-full max-w-sm flex flex-col items-center">
                                <div className="mb-6 text-center">
                                    <h3 className="text-xl font-bold text-white mb-2">Aponte a câmara</h3>
                                    <p className="text-sm text-white/50">Centre o QR code dentro do quadrado</p>
                                </div>

                                <div className="w-full bg-black rounded-[32px] overflow-hidden border border-white/10 relative aspect-[4/5] flex items-center justify-center dashboard-scanner-container shadow-2xl">
                                    <div id="dashboard-reader" className="w-full h-full relative" />
                                </div>

                                <div className="mt-8 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[12px] font-bold text-white/60 tracking-widest uppercase">Câmara Ativa</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </PageShell>
            <style dangerouslySetInnerHTML={{
                __html: `
          .dashboard-scanner-container #dashboard-reader { border: none !important; width: 100% !important; height: 100% !important; background: black; }
          .dashboard-scanner-container video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 32px !important; }
          .dashboard-scanner-container #dashboard-reader__scan_region { background: transparent !important; }
          .dashboard-scanner-container #dashboard-reader__scan_region img { opacity: 0.1 !important; transform: scale(1.1); }
          .dashboard-scanner-container #dashboard-reader__dashboard { display: none !important; }
        `}} />
        </>
    );
}
