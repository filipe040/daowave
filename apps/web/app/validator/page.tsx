"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";

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
  const [deviceId] = useState(() => `device-${Math.random().toString(36).substr(2, 9)}`);
  const [html5QrCode, setHtml5QrCode] = useState<any>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  // Check if we're in a secure context (HTTPS or localhost)
  // window.isSecureContext is the most reliable way to check
  const [isSecureContext, setIsSecureContext] = useState(false);
  
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Force secure context if protocol is HTTPS, even if certificate is self-signed
      // This is the key fix: window.isSecureContext might be false with self-signed certs,
      // but if protocol is https:, we should allow camera access
      const isHttps = window.location.protocol === "https:";
      const isLocalhost = window.location.hostname === "localhost" || 
                          window.location.hostname === "127.0.0.1";
      const isSecure = isHttps || isLocalhost || window.isSecureContext;
      
      setIsSecureContext(isSecure);
      
      // Log for debugging
      if (isHttps && !window.isSecureContext) {
        console.info("ℹ️ HTTPS detectado com certificado auto-assinado. Câmara deveria funcionar.");
      } else if (!isSecure && window.location.protocol === "http:") {
        console.warn("⚠️ Acesso via HTTP detectado. HTTPS é necessário para a câmara.");
        console.warn(`   Aceda via: https://${window.location.hostname}:${window.location.port || 3000}`);
        console.warn(`   Certifique-se que o servidor HTTPS está a correr: npm run dev:https`);
      }
    }
  }, []);

  useEffect(() => {
    if (!scanning || typeof window === "undefined") return;

    const initScanner = async () => {
      setCameraError(null);
      
      try {
        // Check if camera is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Este browser não suporta acesso à câmara. Tente usar Chrome, Firefox ou Safari.");
        }

        // Check if we're in a secure context (HTTPS or localhost)
        // Also check directly here in case state hasn't updated yet
        const currentIsSecure = typeof window !== "undefined" && 
          (window.location.protocol === "https:" || 
           window.location.hostname === "localhost" ||
           window.location.hostname === "127.0.0.1" ||
           window.isSecureContext);
        
        if (!currentIsSecure && !isSecureContext) {
          const currentUrl = typeof window !== "undefined" ? window.location.href : "";
          throw new Error(`Acesso à câmara requer HTTPS. Aceda via: ${currentUrl.replace('http:', 'https:')}`);
        }

        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("reader");
        setHtml5QrCode(scanner);
        scannerRef.current = scanner;
        isScanningRef.current = false;

        // Try to get camera permission first
        try {
          await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        } catch (permError: any) {
          if (permError.name === "NotAllowedError") {
            throw new Error("Permissão para usar a câmara foi negada. Por favor, permita o acesso à câmara nas definições do browser.");
          } else if (permError.name === "NotFoundError") {
            throw new Error("Nenhuma câmara encontrada. Verifique se o dispositivo tem uma câmara disponível.");
          } else {
            throw permError;
          }
        }

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            handleValidate(decodedText);
            stopScanner();
            setScanning(false);
          },
          () => {
            // Ignore scanning errors
          }
        );
        
        // Mark as scanning after successful start
        isScanningRef.current = true;
      } catch (err: any) {
        console.error("Error starting camera:", err);
        setCameraError(err.message || "Erro ao iniciar a câmara. Use o modo manual abaixo.");
        setScanning(false);
        scannerRef.current = null;
        isScanningRef.current = false;
      }
    };

    initScanner();

    return () => {
      stopScanner();
    };
  }, [scanning, isSecureContext]);

  // Helper function to safely stop scanner
  const stopScanner = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        isScanningRef.current = false;
      } catch (error: any) {
        // Ignore errors if scanner is already stopped
        if (!error.message?.includes("not running") && !error.message?.includes("not started")) {
          console.warn("Error stopping scanner:", error);
        }
        isScanningRef.current = false;
      }
    }
    scannerRef.current = null;
  };

  const handleValidate = async (token: string) => {
    try {
      const res = await fetch("/api/validator/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, deviceId }),
      });

      const data = await res.json();
      setResult(data);

      // Clear result after 5 seconds
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      console.error("Validation error:", error);
      setResult({
        valid: false,
        result: "invalid",
        message: "Erro ao validar bilhete",
      });
    }
  };

  const handleManualValidate = () => {
    if (manualCode.trim()) {
      handleValidate(manualCode.trim());
      setManualCode("");
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-700 border-t-white" />
          <p className="text-zinc-400">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!session || (session.user.role !== "VALIDATOR" && session.user.role !== "ADMIN")) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 text-6xl opacity-50">🔒</div>
          <h2 className="mb-2 text-2xl font-bold">Acesso restrito</h2>
          <p className="mb-6 text-zinc-400">Esta área é apenas para validadores</p>
          <a
            href="/auth/signin"
            className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/20"
          >
            Iniciar sessão
          </a>
        </div>
      </div>
    );
  }

  const getResultColor = () => {
    if (!result) return "";
    if (result.valid) return "bg-green-500/20 border-green-500 text-green-400";
    if (result.result === "already_used") return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
    return "bg-red-500/20 border-red-500 text-red-400";
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Validador de Bilhetes</h1>
        <p className="text-sm sm:text-base text-zinc-400">Escaneie o código QR do bilhete para validar</p>
      </div>

      {result && (
        <div className={`rounded-2xl border-2 p-8 text-center backdrop-blur-sm animate-slide-up ${getResultColor()}`}>
          <div className="mb-4 text-6xl font-bold">
            {result.valid ? "✓" : result.result === "already_used" ? "⚠" : "✗"}
          </div>
          <p className="text-xl font-bold mb-2">{result.message}</p>
          {result.lastCheckinAt && (
            <p className="text-sm opacity-75">
              Check-in: {new Date(result.lastCheckinAt).toLocaleString("pt-PT")}
            </p>
          )}
          {result.entriesUsed !== undefined && (
            <p className="text-sm opacity-75">
              Entradas utilizadas: {result.entriesUsed}
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        {cameraError && (
          <div className="rounded-2xl border border-yellow-500/50 bg-yellow-500/10 p-6 backdrop-blur-sm">
            <div className="mb-2 text-yellow-400 text-lg font-semibold">⚠️ Erro ao aceder à câmara</div>
            <p className="text-yellow-300 text-sm mb-4">{cameraError}</p>
            {!isSecureContext && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 mt-4">
                <p className="text-yellow-300 text-sm mb-2"><strong>Nota sobre HTTPS:</strong></p>
                <p className="text-yellow-300 text-xs">
                  Para usar a câmara em dispositivos móveis, o site precisa de HTTPS. Pode:
                </p>
                <ul className="text-yellow-300 text-xs mt-2 ml-4 list-disc space-y-1">
                  <li>Usar a <strong>entrada manual</strong> abaixo (funciona sempre)</li>
                  <li>Configurar HTTPS local (ver guia no README)</li>
                  <li>Usar um túnel como ngrok para desenvolvimento</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {scanning && !cameraError && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
            <div id="reader" className="mx-auto max-w-sm"></div>
            <button
              onClick={async () => {
                await stopScanner();
                setScanning(false);
                setCameraError(null);
                setHtml5QrCode(null);
              }}
              className="mt-6 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 font-semibold transition-all hover:bg-zinc-700 hover:scale-105 active:scale-95"
            >
              Parar scanner
            </button>
          </div>
        )}

        {!scanning && (
          <button
            onClick={() => {
              setCameraError(null);
              setScanning(true);
            }}
            disabled={typeof window !== "undefined" && !isSecureContext}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            📷 Iniciar scanner {typeof window !== "undefined" && !isSecureContext && "(Requer HTTPS)"}
          </button>
        )}

        {!isSecureContext && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
            <p className="text-blue-300 text-sm">
              💡 <strong>Dica:</strong> A câmara requer HTTPS. Use a <strong>entrada manual</strong> abaixo para validar bilhetes.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Ou introduza o código manualmente
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualValidate()}
              placeholder="Colar código do bilhete..."
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={handleManualValidate}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-zinc-950 transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/20 active:scale-95"
            >
              Validar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
