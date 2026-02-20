"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ErrorState } from "@/components/dashboard/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { toast } from "sonner";

interface AccountData {
    brandName: string;
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
            const json = await res.json();
            const acc: AccountData = {
                brandName: json.brandName ?? "",
                contactEmail: json.contactEmail ?? null,
                vatNumber: json.vatNumber ?? null,
                status: json.status ?? "",
            };
            setAccount(acc);
            setBrandName(acc.brandName);
        } catch (err: any) {
            setError(err.message ?? "Erro desconhecido");
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
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? `Erro ${res.status}`);
            }
            toast.success("Definições guardadas com sucesso");
            await load();
        } catch (err: any) {
            toast.error(err.message ?? "Erro ao guardar");
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageShell
            title="Definições"
            subtitle="Gerencie o perfil da sua organização"
        >
            {loading && (
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
            )}

            {!loading && error && <ErrorState message={error} onRetry={load} />}

            {!loading && !error && account && (
                <div className="max-w-lg space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Perfil da Organização</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="brandName">Nome da marca</Label>
                                <Input
                                    id="brandName"
                                    value={brandName}
                                    onChange={(e) => setBrandName(e.target.value)}
                                    placeholder="Nome da sua organização"
                                />
                            </div>
                            {account.contactEmail && (
                                <div className="space-y-1">
                                    <Label>Email de contacto</Label>
                                    <Input value={account.contactEmail} disabled />
                                    <p className="text-xs text-muted-foreground">
                                        Para alterar o email de contacto, contacte o suporte.
                                    </p>
                                </div>
                            )}
                            {account.vatNumber && (
                                <div className="space-y-1">
                                    <Label>NIF</Label>
                                    <Input value={account.vatNumber} disabled />
                                </div>
                            )}
                            <div className="pt-2">
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !brandName.trim()}
                                >
                                    {saving ? "A guardar…" : "Guardar alterações"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </PageShell>
    );
}
