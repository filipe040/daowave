"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QrCode, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

export default function CheckinPage() {
    const [manualCode, setManualCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleScan = async (qrPayload: string) => {
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch("/api/checkin/scan", {
                method: "POST",
                body: JSON.stringify({ qrPayload }),
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            setResult({ valid: false, result: "ERROR", message: "Erro de conexão" });
        } finally {
            setLoading(false);
        }
    };

    const onManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCode) return;
        // For manual entry, we might need a different API or just assume the code is the payload (which it isn't usually).
        // In a real app, manual entry finds the ticket by code, then validates.
        // Here we'll just mock passing it to scan if it looks like a payload, or show error.
        handleScan(manualCode);
    };

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-6">Check-in</h2>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Scanner Section */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center text-white">
                            <QrCode className="mr-2 h-5 w-5" /> Scanner
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[300px] bg-black/50 rounded-lg border-2 border-dashed border-zinc-700 m-4">
                        <div className="text-zinc-500 text-center p-4">
                            <p>Câmara não detetada ou permissão negada.</p>
                            <p className="text-xs mt-2">(Funcionalidade de câmara requer HTTPS e permissões)</p>
                        </div>
                        <Button variant="secondary" className="mt-4">
                            Ativar Câmara
                        </Button>
                    </CardContent>
                </Card>

                {/* Manual Entry & Results */}
                <div className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Entrada Manual</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={onManualSubmit} className="flex gap-2">
                                <Input
                                    placeholder="Inserir código do bilhete..."
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    className="bg-zinc-950 border-zinc-700 text-white"
                                />
                                <Button type="submit" disabled={loading}>
                                    {loading ? "..." : "Validar"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {result && (
                        <Card className={`border-l-4 ${result.result === 'SUCCESS' ? 'border-l-green-500 bg-green-900/10' :
                                result.result === 'ALREADY_USED' ? 'border-l-yellow-500 bg-yellow-900/10' :
                                    'border-l-red-500 bg-red-900/10'
                            }`}>
                            <CardContent className="pt-6">
                                <div className="flex items-start">
                                    {result.result === 'SUCCESS' && <CheckCircle2 className="h-8 w-8 text-green-500 mr-4" />}
                                    {result.result === 'ALREADY_USED' && <AlertTriangle className="h-8 w-8 text-yellow-500 mr-4" />}
                                    {(result.result === 'INVALID' || result.result === 'ERROR') && <XCircle className="h-8 w-8 text-red-500 mr-4" />}

                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1">
                                            {result.message}
                                        </h3>
                                        {result.ticket && (
                                            <div className="text-sm text-zinc-300 space-y-1">
                                                <p><span className="font-semibold">Titular:</span> {result.ticket.holder}</p>
                                                <p><span className="font-semibold">Tipo:</span> {result.ticket.type}</p>
                                                {result.ticket.lastScannedBy && (
                                                    <p className="text-yellow-500 text-xs mt-2">Validado anteriormente por: {result.ticket.lastScannedBy}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
