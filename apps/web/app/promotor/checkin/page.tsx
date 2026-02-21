"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { QrCode, CheckCircle2, XCircle, AlertTriangle, Building2 } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

interface Org { id: string; name: string; role: string }
interface Event { id: string; title: string; slug: string }

interface CheckinResult {
    success?: boolean;
    error?: string;
    message?: string;
    checkedInAt?: string;
    checkedInByName?: string;
    ticket?: {
        id: string;
        holder?: string;
        type?: string;
    };
}

type ResultState =
    | { kind: "success"; ticket: CheckinResult["ticket"]; message: string }
    | { kind: "duplicate"; message: string; at: string; by: string | null }
    | { kind: "error"; message: string };

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

    // Load orgs
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

    // Load events for selected org
    const loadEvents = useCallback(async () => {
        if (!orgId) return;
        setLoadingEvents(true);
        try {
            const res = await fetchWithTimeout(`/api/promotor/events?orgId=${orgId}&page=1`);
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as { events?: Event[] };
            setEvents(json.events ?? []);
        } catch { setEvents([]); }
        finally { setLoadingEvents(false); }
    }, [orgId]);

    useEffect(() => { loadOrgs(); }, [loadOrgs]);
    useEffect(() => { if (orgId) loadEvents(); }, [orgId, loadEvents]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !qrCode.trim()) return;
        setChecking(true); setResult(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/checkin/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qrCode: qrCode.trim(), eventId, deviceId: null }),
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
            setQrCode(""); // clear for next scan
        }
    };

    const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors";
    const labelCls = "block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5";

    if (!loadingOrgs && orgError) return <PageShell title="Check-in"><ErrorState message={orgError} onRetry={loadOrgs} /></PageShell>;
    if (!loadingOrgs && orgs.length === 0) return (
        <PageShell title="Check-in">
            <EmptyState icon={Building2} title="Sem organização" description="Para fazer check-in precisa de pertencer a uma organização." />
        </PageShell>
    );

    return (
        <PageShell title="Check-in" subtitle="Validação de bilhetes">
            <div className="max-w-xl space-y-4">
                {/* Event selector card */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm divide-y divide-gray-100">
                    {/* Org selector */}
                    {orgs.length > 1 && (
                        <div className="px-6 py-5 space-y-1.5">
                            <label className={labelCls}>Organização</label>
                            <select className={inputCls} value={orgId} onChange={(e) => { setOrgId(e.target.value); setEventId(""); }}>
                                <option value="">Selecionar…</option>
                                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Event selector */}
                    <div className="px-6 py-5 space-y-1.5">
                        <label className={labelCls}>Evento</label>
                        {loadingEvents ? (
                            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                        ) : (
                            <select
                                className={inputCls}
                                value={eventId}
                                onChange={(e) => { setEventId(e.target.value); setResult(null); }}
                                disabled={!orgId}
                            >
                                <option value="">{orgId ? "Selecionar evento…" : "Selecionar organização primeiro"}</option>
                                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                {/* Scan form */}
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
                        <QrCode className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
                        <h2 className="text-sm font-semibold text-gray-900">Código do bilhete</h2>
                    </div>
                    <form onSubmit={handleVerify} className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <label className={labelCls}>QR Code / Código manual</label>
                            <input
                                autoFocus
                                placeholder="Leia o QR ou insira o código…"
                                value={qrCode}
                                onChange={(e) => setQrCode(e.target.value)}
                                className={`${inputCls} font-mono`}
                                disabled={!eventId}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={checking || !eventId || !qrCode.trim()}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {checking ? "A validar…" : "Validar bilhete"}
                        </button>
                    </form>
                </div>

                {/* Result */}
                {result && (
                    <div className={`rounded-2xl border shadow-sm p-6 ${result.kind === "success"
                        ? "bg-emerald-50 border-emerald-200"
                        : result.kind === "duplicate"
                            ? "bg-amber-50 border-amber-200"
                            : "bg-red-50 border-red-200"
                        }`}>
                        <div className="flex items-start gap-4">
                            {result.kind === "success" && <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0 mt-0.5" strokeWidth={1.75} />}
                            {result.kind === "duplicate" && <AlertTriangle className="h-7 w-7 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.75} />}
                            {result.kind === "error" && <XCircle className="h-7 w-7 text-red-500 shrink-0 mt-0.5" strokeWidth={1.75} />}
                            <div className="space-y-1 min-w-0">
                                <p className={`text-sm font-semibold ${result.kind === "success" ? "text-emerald-800" : result.kind === "duplicate" ? "text-amber-800" : "text-red-700"}`}>
                                    {result.kind === "success" ? "Bilhete válido" : result.kind === "duplicate" ? "Bilhete já utilizado" : "Bilhete inválido"}
                                </p>
                                <p className="text-sm text-gray-600">{result.message}</p>
                                {result.kind === "success" && result.ticket && (
                                    <div className="text-xs text-gray-500 space-y-0.5 pt-1">
                                        {result.ticket.holder && <p><span className="font-medium">Titular:</span> {result.ticket.holder}</p>}
                                        {result.ticket.type && <p><span className="font-medium">Tipo:</span> {result.ticket.type}</p>}
                                    </div>
                                )}
                                {result.kind === "duplicate" && (
                                    <p className="text-xs text-amber-700 pt-1">
                                        Utilizado em {new Date(result.at).toLocaleString("pt-PT")}
                                        {result.by && ` por ${result.by}`}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
