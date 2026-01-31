/**
 * Check-in Scanner Page
 */

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckinPage() {
  const params = useParams();
  const eventId = (params?.eventId as string) || "";

  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleVerify = async () => {
    if (!qrCode.trim()) {
      setResult({ success: false, message: "Por favor, insira o código QR" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/promotor/checkin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode, eventId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setResult({ success: false, message: data?.error || "Erro ao verificar bilhete" });
        return;
      }

      setResult({ success: true, message: data?.message || "Bilhete verificado com sucesso!" });
      setQrCode("");
    } catch (error) {
      console.error("Check-in error:", error);
      setResult({ success: false, message: "Erro ao verificar bilhete" });
    } finally {
      setLoading(false);
    }
  };

  const resultClass =
    result?.success
      ? "border border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/10 text-foreground"
      : "border border-destructive/30 bg-destructive/10 text-foreground";

  return (
    <div data-testid="page-promotor-checkin" className="min-h-screen bg-background py-10 sm:py-12">
      <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Operações
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Check-in de Bilhetes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cola o payload do QR (base64) para validar a assinatura e estado do bilhete.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          {/* Input */}
          <div className="mb-5 sm:mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Código QR do Bilhete
            </label>

            <textarea
              data-testid="input-qr"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Cole ou digite o código QR aqui..."
              rows={5}
              className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 font-mono
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>

          {/* Action */}
          <Button
            onClick={handleVerify}
            disabled={loading || !qrCode.trim() || !eventId}
            className="w-full"
            size="lg"
          >
            {loading ? "A verificar..." : "Verificar Bilhete"}
          </Button>

          {!eventId && (
            <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-foreground">
                Falta <strong>eventId</strong> na rota. Confirma que esta página está em{" "}
                <span className="font-mono">/promotor/events/[eventId]/checkin</span> (ou equivalente).
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div data-testid="checkin-result" className={`mt-5 rounded-xl p-4 ${resultClass}`}>
              <p className="text-sm font-semibold flex items-center gap-2">
                {result.success ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                {result.message}
              </p>
            </div>
          )}

          {/* Note */}
          <div className="mt-6 rounded-xl border border-border bg-secondary p-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Nota:</strong> cola o código QR completo (base64).
              O sistema valida a assinatura e confirma se o bilhete já foi usado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}