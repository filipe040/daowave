"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";

interface AccountData {
    brandName: string | null;
    contactEmail: string | null;
    vatNumber: string | null;
    status: string;
}

export default function PromoterSettingsPage() {
    const [account, setAccount] = useState<AccountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brandName, setBrandName] = useState("");

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/overview");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as AccountData;
            setAccount(json);
            setBrandName(json.brandName ?? "");
        } catch (err: unknown) { setError(err instanceof Error ? err.message : "Erro"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetchWithTimeout("/api/promotor/account", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ brandName }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({})) as { error?: string };
                throw new Error(body.error ?? `Erro ${res.status}`);
            }
            toast.success("Definições guardadas");
            await load();
        } catch (err: unknown) { toast.error(err instanceof Error ? err.message : "Erro ao guardar"); }
        finally { setSaving(false); }
    };

    const dirty = account !== null && brandName !== (account.brandName ?? "");

    return (
        <PageShell title="Definições" subtitle="Perfil da organização">
            {loading && <Skeleton className="h-72 w-full rounded-2xl" />}
            {!loading && error && <ErrorState message={error} onRetry={load} />}
            {!loading && !error && account && (
                <div className="max-w-xl space-y-4">
                    <div className="bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Section header */}
                        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
                            <Building2 className="h-4 w-4 text-white/40" strokeWidth={1.75} />
                            <h2 className="text-sm font-semibold text-white/92 tracking-wide">Perfil da Organização</h2>
                        </div>

                        <div className="px-6 py-6 space-y-6">
                            {/* Brand name */}
                            <div className="space-y-2">
                                <label htmlFor="brandName" className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.1em]">
                                    Nome da marca
                                </label>
                                <input
                                    id="brandName"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="Nome da sua organização"
                                    className="w-full rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 px-5 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 focus:bg-white/10 transition-colors"
                                />
                            </div>

                            {account.contactEmail && (
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.1em]">
                                        Email de contacto
                                    </label>
                                    <input
                                        value={account.contactEmail}
                                        disabled
                                        className="w-full rounded-2xl border border-white/5 bg-white/[0.02] text-white/40 px-5 py-3.5 text-[15px] cursor-not-allowed"
                                    />
                                    <p className="text-[12px] text-white/30">Para alterar, contacte o suporte.</p>
                                </div>
                            )}

                            {account.vatNumber && (
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-bold text-white/40 uppercase tracking-[0.1em]">NIF</label>
                                    <input
                                        value={account.vatNumber}
                                        disabled
                                        className="w-full rounded-2xl border border-white/5 bg-white/[0.02] text-white/40 px-5 py-3.5 text-[15px] cursor-not-allowed"
                                    />
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center gap-2 pt-2">
                                <div className={`w-2 h-2 rounded-full shadow-[0_0_12px_rgba(0,0,0,0.5)] ${account.status === "APPROVED" ? "bg-emerald-400 shadow-emerald-400/50" : "bg-amber-400 shadow-amber-400/50"}`} />
                                <span className="text-[13px] font-bold text-white/60 tracking-wide">
                                    Conta {account.status === "APPROVED" ? "Aprovada" : account.status}
                                </span>
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-white/5 flex justify-end bg-black/20">
                            <button
                                onClick={handleSave}
                                disabled={saving || !brandName.trim() || !dirty}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-bold bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-xl shadow-white/5"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "A guardar…" : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
