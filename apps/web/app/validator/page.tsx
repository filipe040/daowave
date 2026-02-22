"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle, AlertTriangle, Ban, XCircle, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [parsingFile, setParsingFile] = useState(false);
  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  // Secure context guard (HTTPS / localhost)
  const [isSecureContext, setIsSecureContext] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isHttps = window.location.protocol === "https:";
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.") ||
      window.location.hostname.startsWith("10.");
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingFile(true);
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("reader");
      const result = await html5QrCode.scanFile(file, true);
      handleValidate(result);
    } catch (err: any) {
      console.error("Error parsing QR from image:", err);
      setCameraError("Não foi possível ler um QR Code na imagem. Tende aproximar o bilhete e evite reflexos.");
    } finally {
      setParsingFile(false);
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (!scanning || typeof window === "undefined") return;

    const initScanner = async () => {
      setCameraError(null);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("O seu browser bloqueou o acesso à câmara porque não está a usar HTTPS ou Safari/Chrome atualizados.");
        }

        const currentIsSecure =
          window.location.protocol === "https:" ||
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname.startsWith("192.168.") ||
          window.location.hostname.startsWith("10.") ||
          window.isSecureContext;

        if (!currentIsSecure && !isSecureContext) {
          const currentUrl = window.location.href;
          throw new Error(`Acesso à câmara requer contexto seguro. Pode não funcionar neste endereço: ${currentUrl}`);
        }

        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        isScanningRef.current = false;

        // Skip exact Permission check here because Html5Qrcode handles permissions inside
        // start() natively anyway, avoiding double-prompts or crashes on some browsers

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
      <div className="min-h-screen grid place-items-center px-4 bg-black">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm text-white/55">A carregar segurança…</p>
        </div>
      </div>
    );
  }

  if (!session || (session.user.role !== "USER" && session.user.role !== "ADMIN")) {
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-black">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,.45)]">
          <div className="mb-5 flex justify-center">
            <Lock className="h-16 w-16 text-white/30" strokeWidth={1.5} />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-white/92">Acesso restrito</h2>
          <p className="mb-8 text-[15px] text-white/55">Esta área é reservada a validadores autorizados.</p>

          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center w-full rounded-full bg-white px-6 py-4 text-[15px] font-bold text-black shadow-lg shadow-white/10 transition-all hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            Iniciar sessão
          </Link>
        </div>
      </div>
    );
  }

  const getResultStyles = () => {
    if (!result) return "";
    if (result.valid) return "border-emerald-500/40 bg-emerald-500/15 text-emerald-100";
    if (result.result === "already_used") return "border-amber-500/40 bg-amber-500/15 text-amber-100";
    if (result.result === "cancelled") return "border-white/20 bg-white/10 text-white/90";
    return "border-rose-500/40 bg-rose-500/15 text-rose-100";
  };

  const ResultIcon = () => {
    if (!result) return null;
    const size = "h-16 w-16 sm:h-20 sm:w-20";
    if (result.valid) return <CheckCircle className={`${size} text-emerald-400 mx-auto`} strokeWidth={1.5} />;
    if (result.result === "already_used") return <AlertTriangle className={`${size} text-amber-400 mx-auto`} strokeWidth={1.5} />;
    if (result.result === "cancelled") return <Ban className={`${size} text-white/50 mx-auto`} strokeWidth={1.5} />;
    return <XCircle className={`${size} text-rose-400 mx-auto`} strokeWidth={1.5} />;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-10 sm:p-12 animate-fade-in" data-testid="validator-page">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Operações</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-white/92">Validador de Bilhetes</h1>
          <p className="mt-2 text-[15px] sm:text-base text-white/60">
            Escaneie o QR ou valide o bilhete manualmente.
          </p>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`rounded-3xl border p-8 sm:p-10 text-center backdrop-blur-3xl shadow-[0_18px_60px_rgba(0,0,0,.45)] animate-slide-up ${getResultStyles()}`}
            role="status"
            aria-live="polite"
          >
            <div className="mb-4 flex justify-center"><ResultIcon /></div>
            <p className="text-xl sm:text-2xl font-bold tracking-tight">{result.message}</p>

            <div className="mt-4 space-y-1.5 text-[14px] opacity-80">
              {result.lastCheckinAt && (
                <p>Check-in em: {new Date(result.lastCheckinAt).toLocaleString("pt-PT")}</p>
              )}
              {typeof result.entriesUsed === "number" && <p>Entradas utilizadas: {result.entriesUsed}</p>}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="space-y-4">
          {/* Camera error */}
          {cameraError && (
            <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6 backdrop-blur-xl">
              <div className="mb-1 text-[15px] font-semibold text-amber-500">Atenção: câmara indisponível</div>
              <p className="text-[14px] text-amber-200/80">{cameraError}</p>

              {!isSecureContext && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-[13px] font-semibold text-white/90">Nota técnica (HTTPS)</p>
                  <p className="mt-1 text-[13px] text-white/55 leading-relaxed">
                    Em mobile, o acesso à câmara requer HTTPS. Use a entrada manual ou o upload de imagem abaixo.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Scanner view */}
          {scanning && !cameraError && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_60px_rgba(0,0,0,.45)] backdrop-blur-2xl">
              <div id="reader" className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-black/60"></div>

              <button
                onClick={async () => {
                  await stopScanner();
                  setScanning(false);
                  setCameraError(null);
                }}
                className="mt-6 w-full rounded-full bg-white/10 px-6 py-4 text-[15px] font-semibold text-white border border-white/20
                           transition-all hover:bg-white/20 active:scale-[0.98]
                           focus:outline-none focus:ring-2 focus:ring-white/30"
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
              className="w-full rounded-full bg-white px-6 py-4 sm:py-5 text-[15px] sm:text-lg font-bold text-black shadow-lg shadow-white/10
                         transition-all hover:bg-white/90 active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              Iniciar scanner da câmara
            </button>
          )}

          {/* Tip / Fallback for Local Network Testing */}
          {!isSecureContext && (
            <div className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6 backdrop-blur-xl shadow-sm mt-4">
              <h3 className="mb-2 text-[15px] font-semibold text-amber-500">Acesso Local Limitado</h3>
              <p className="mb-5 text-[14px] text-amber-200/80 leading-relaxed">
                As políticas de segurança restringem o uso da câmara nativa.
                Tire uma foto ao código QR e selecione o ficheiro abaixo:
              </p>

              <label className={cn(
                "flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-6 py-4 text-[15px] font-bold text-amber-200 shadow-[0_8px_32px_rgba(245,158,11,.15)] transition-all",
                parsingFile ? "opacity-60 cursor-not-allowed" : "hover:bg-amber-500/30 active:scale-[0.98]"
              )}>
                <Upload className="h-5 w-5" />
                {parsingFile ? "A analisar imagem…" : "Selecionar Foto / Código QR"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={parsingFile}
                />
              </label>
              <div id="reader" style={{ display: "none" }}></div>
            </div>
          )}

          {/* Manual input */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,.45)] mt-4">
            <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-wider text-white/45">
              Validar por código
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualValidate()}
                placeholder="Exemplo: C8F9K..."
                className="flex-1 rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-[15px] font-mono uppercase text-white placeholder:text-white/30 placeholder:font-sans placeholder:capitalize
                           focus:outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10 transition-all"
              />

              <button
                onClick={handleManualValidate}
                disabled={!manualCode.trim()}
                className="rounded-full bg-white/10 px-8 py-4 text-[15px] font-bold text-white border border-white/20
                           transition-all hover:bg-white/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Validar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}