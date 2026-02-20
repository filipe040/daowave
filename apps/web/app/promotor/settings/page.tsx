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
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                        {/* Section header */}
                        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
                            <Building2 className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
                            <h2 className="text-sm font-semibold text-gray-900">Perfil da Organização</h2>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {/* Brand name */}
                            <div className="space-y-1.5">
                                <label htmlFor="brandName" className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nome da marca
                                </label>
                                <input
                                    id="brandName"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="Nome da sua organização"
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors"
                                />
                            </div>

                            {account.contactEmail && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email de contacto
                                    </label>
                                    <input
                                        value={account.contactEmail}
                                        disabled
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 text-gray-400 px-4 py-2.5 text-sm cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400">Para alterar, contacte o suporte.</p>
                                </div>
                            )}

                            {account.vatNumber && (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">NIF</label>
                                    <input
                                        value={account.vatNumber}
                                        disabled
                                        className="w-full rounded-xl border border-gray-100 bg-gray-50 text-gray-400 px-4 py-2.5 text-sm cursor-not-allowed"
                                    />
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center gap-2 pt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${account.status === "APPROVED" ? "bg-emerald-500" : "bg-amber-400"}`} />
                                <span className="text-xs text-gray-400">
                                    Conta {account.status === "APPROVED" ? "aprovada" : account.status}
                                </span>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving || !brandName.trim() || !dirty}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save className="h-3.5 w-3.5" />
                                {saving ? "A guardar…" : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
