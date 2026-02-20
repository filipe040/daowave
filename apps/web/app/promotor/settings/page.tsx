"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";
import { Save, Building2 } from "lucide-react";

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
        setLoading(true);
        setError(null);
        try {
            const res = await fetchWithTimeout("/api/promotor/overview");
            if (!res.ok) throw new Error(`Erro ${res.status}`);
            const json = await res.json() as AccountData & { brandName: string };
            setAccount(json);
            setBrandName(json.brandName ?? "");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
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
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Erro ao guardar");
        } finally {
            setSaving(false);
        }
    };

    const dirty = account !== null && brandName !== (account.brandName ?? "");

    return (
        <PageShell title="Definições" subtitle="Gerencie o perfil da sua organização">
            {loading && <Skeleton className="h-64 w-full rounded-xl" />}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && account && (
                <div className="max-w-2xl space-y-6">
                    <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 overflow-hidden">
                        {/* Card header */}
                        <div className="flex items-center gap-3 border-b border-zinc-700/60 px-5 py-4">
                            <Building2 className="h-5 w-5 text-zinc-400" />
                            <h2 className="font-semibold text-white text-sm">Perfil da Organização</h2>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Brand name */}
                            <div className="space-y-1.5">
                                <label htmlFor="brandName" className="text-sm font-medium text-zinc-300">
                                    Nome da marca
                                </label>
                                <input
                                    id="brandName"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="Nome da sua organização"
                                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                />
                            </div>

                            {/* Read-only fields */}
                            {account.contactEmail && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-300">Email de contacto</label>
                                    <input
                                        value={account.contactEmail}
                                        disabled
                                        className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 text-zinc-500 px-3 py-2 text-sm cursor-not-allowed"
                                    />
                                    <p className="text-xs text-zinc-500">Para alterar, contacte o suporte.</p>
                                </div>
                            )}

                            {account.vatNumber && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-300">NIF</label>
                                    <input
                                        value={account.vatNumber}
                                        disabled
                                        className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 text-zinc-500 px-3 py-2 text-sm cursor-not-allowed"
                                    />
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs text-zinc-400">Estado da conta:</span>
                                <span className={`text-xs font-medium ${account.status === "APPROVED" ? "text-emerald-400" : "text-amber-400"}`}>
                                    {account.status === "APPROVED" ? "Aprovada" : account.status}
                                </span>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !brandName.trim() || !dirty}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? "A guardar…" : "Guardar alterações"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
