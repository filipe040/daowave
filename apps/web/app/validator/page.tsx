"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle, AlertTriangle, Ban, XCircle } from "lucide-react";

interface ValidateResult {
  valid: boolean;
  result: "valid" | "invalid" | "already_used" | "cancelled";
  message: string;
  ticketId?: string;
  lastCheckinAt?: string;
  entriesUsed?: number;
}

export default function ValidatorPage() {
  const { data: session, status } = useSession();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [deviceId] = useState(() => `device-${Math.random().toString(36).slice(2, 11)}`);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  // Secure context guard (HTTPS / localhost)
  const [isSecureContext, setIsSecureContext] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isHttps = window.location.protocol === "https:";
    const isLocalhost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    setIsSecureContext(isHttps || isLocalhost || window.isSecureContext);
  }, []);

  // Stop helper
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (error: any) {
        // ignore "not running"
        const msg = String(error?.message || "");
        if (!msg.includes("not running") && !msg.includes("not started")) {
          console.warn("Error stopping scanner:", error);
        }
      } finally {
        isScanningRef.current = false;
      }
    }
    scannerRef.current = null;
  }, []);

  const handleValidate = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/validator/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, deviceId }),
      });

      const data = await res.json();
      setResult(data);

      // auto-clear
      window.setTimeout(() => setResult(null), 5000);
    } catch (error) {
      console.error("Validation error:", error);
      setResult({ valid: false, result: "invalid", message: "Erro ao validar bilhete" });
    }
  }, [deviceId]);

  const handleManualValidate = () => {
    const token = manualCode.trim();
    if (!token) return;
    handleValidate(token);
    setManualCode("");
  };

  useEffect(() => {
    if (!scanning || typeof window === "undefined") return;

    const initScanner = async () => {
      setCameraError(null);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Este browser não suporta acesso à câmara. Use Chrome, Safari ou Firefox.");
        }

        const currentIsSecure =
          window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.isSecureContext;

        if (!currentIsSecure && !isSecureContext) {
          const currentUrl = window.location.href;
          throw new Error(`Acesso à câmara requer HTTPS. Aceda via: ${currentUrl.replace("http:", "https:")}`);
        }

        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        isScanningRef.current = false;

        // Permission check
        try {
          await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        } catch (permError: any) {
          if (permError?.name === "NotAllowedError") {
            throw new Error(
              "Permissão para usar a câmara foi negada. Ative o acesso à câmara nas definições do browser."
            );
          }
          if (permError?.name === "NotFoundError") {
            throw new Error("Nenhuma câmara encontrada. Verifique se o dispositivo tem câmara.");
          }
          throw permError;
        }

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            handleValidate(decodedText);
            stopScanner();
            setScanning(false);
          },
          () => { }
        );

        isScanningRef.current = true;
      } catch (err: any) {
        console.error("Error starting camera:", err);
        setCameraError(err?.message || "Erro ao iniciar a câmara. Use o modo manual abaixo.");
        setScanning(false);
        scannerRef.current = null;
        isScanningRef.current = false;
      }
    };

    initScanner();
    return () => {
      stopScanner();
    };
  }, [scanning, isSecureContext, handleValidate, stopScanner]);

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
          <p className="text-sm text-muted-foreground">A carregar…</p>
        </div>
      </div>
    );
  }

  if (!session || (session.user.role !== "USER" && session.user.role !== "ADMIN")) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mb-5 flex justify-center">
            <Lock className="h-14 w-14 text-zinc-400" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-foreground">Acesso restrito</h2>
          <p className="mb-6 text-sm text-muted-foreground">Esta área é apenas para validadores.</p>

          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Iniciar sessão
          </Link>
        </div>
      </div>
    );
  }

  const getResultStyles = () => {
    if (!result) return "";
    if (result.valid) return "border-emerald-500/40 bg-emerald-500/10 text-foreground";
    if (result.result === "already_used") return "border-amber-500/40 bg-amber-500/10 text-foreground";
    if (result.result === "cancelled") return "border-slate-500/40 bg-slate-500/10 text-foreground";
    return "border-rose-500/40 bg-rose-500/10 text-foreground";
  };

  const ResultIcon = () => {
    if (!result) return null;
    const size = "h-14 w-14 sm:h-16 sm:w-16";
    if (result.valid) return <CheckCircle className={`${size} text-emerald-500 mx-auto`} strokeWidth={1.5} />;
    if (result.result === "already_used") return <AlertTriangle className={`${size} text-amber-500 mx-auto`} strokeWidth={1.5} />;
    if (result.result === "cancelled") return <Ban className={`${size} text-slate-500 mx-auto`} strokeWidth={1.5} />;
    return <XCircle className={`${size} text-rose-500 mx-auto`} strokeWidth={1.5} />;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 animate-fade-in" data-testid="validator-page">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground">Validador de Bilhetes</h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Escaneie o QR do bilhete ou valide pelo código manual.
        </p>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`rounded-2xl border p-6 sm:p-8 text-center shadow-sm animate-slide-up ${getResultStyles()}`}
          role="status"
          aria-live="polite"
        >
          <div className="mb-3 flex justify-center"><ResultIcon /></div>
          <p className="text-lg sm:text-xl font-semibold">{result.message}</p>

          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {result.lastCheckinAt && (
              <p>Check-in: {new Date(result.lastCheckinAt).toLocaleString("pt-PT")}</p>
            )}
            {typeof result.entriesUsed === "number" && <p>Entradas utilizadas: {result.entriesUsed}</p>}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="space-y-4">
        {/* Camera error */}
        {cameraError && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
            <div className="mb-1 text-sm font-semibold text-foreground">Atenção: câmara indisponível</div>
            <p className="text-sm text-muted-foreground">{cameraError}</p>

            {!isSecureContext && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">Nota técnica (HTTPS)</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Em mobile, a câmara exige HTTPS. Em produção, garante SSL no domínio. Para já, usa a entrada manual.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Scanner */}
        {scanning && !cameraError && (
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div id="reader" className="mx-auto max-w-sm"></div>

            <button
              onClick={async () => {
                await stopScanner();
                setScanning(false);
                setCameraError(null);
              }}
              className="mt-5 w-full rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground border border-border
                         transition-colors hover:bg-secondary/80
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Parar scanner
            </button>
          </div>
        )}

        {/* Start scanner */}
        {!scanning && (
          <button
            onClick={() => {
              setCameraError(null);
              setScanning(true);
            }}
            disabled={typeof window !== "undefined" && !isSecureContext}
            className="w-full rounded-2xl bg-primary px-6 py-4 text-base sm:text-lg font-semibold text-primary-foreground shadow-sm
                       transition-colors hover:bg-primary/90
                       disabled:opacity-50 disabled:cursor-not-allowed
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Iniciar scanner {typeof window !== "undefined" && !isSecureContext ? "(requer HTTPS)" : ""}
          </button>
        )}

        {/* Tip */}
        {!isSecureContext && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Dica: se estiveres em HTTP, usa a entrada manual. Para ativar a câmara em mobile, serve a app em HTTPS.
            </p>
          </div>
        )}

        {/* Manual */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Validar por código
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualValidate()}
              placeholder="Colar código do bilhete…"
              className="flex-1 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />

            <button
              onClick={handleManualValidate}
              className="rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground border border-border
                         transition-colors hover:bg-secondary/80
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Validar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}