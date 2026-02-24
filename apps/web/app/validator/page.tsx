"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle, Ban, XCircle, Upload, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidateResult {
  success: boolean;
  resultType: string;
  message: string;
  ticketHolderName?: string;
  scannedAt?: string;
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

  // Audio References
  const successAudio = useRef<HTMLAudioElement | null>(null);
  const errorAudio = useRef<HTMLAudioElement | null>(null);

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

    // Initialize audio (could use simple base64 beeps to avoid external assets)
    successAudio.current = new Audio("/sounds/success.mp3"); // Ensure you place physical files or ignore 404s
    errorAudio.current = new Audio("/sounds/error.mp3");
  }, []);

  const playFeedback = (success: boolean) => {
    try {
      if (success && successAudio.current) {
        successAudio.current.currentTime = 0;
        successAudio.current.play().catch(() => { });
      } else if (!success && errorAudio.current) {
        errorAudio.current.currentTime = 0;
        errorAudio.current.play().catch(() => { });
      }
    } catch { }
  };

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (error: any) {
        // ignore
      } finally {
        isScanningRef.current = false;
      }
    }
    scannerRef.current = null;
  }, []);

  // Base setup for IndexedDB offline syncing (Phase 8 MVP)
  const syncOfflineQueue = async () => {
    // TODO: Implement IndexedDB queue reader and batch uploader
    console.log("Offline Sync Placeholder triggered");
  };

  const handleValidate = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/validator/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, deviceId }), // Needs eventId ideally passed down if locked to event
      });

      const data = await res.json();
      setResult(data);
      playFeedback(data.success);

      // Auto-clear fullscreen after 1.5 seconds to keep the line moving
      window.setTimeout(() => setResult(null), 2000);
    } catch (error) {
      console.error("Validation error:", error);
      const errRes = { success: false, resultType: "error", message: "Erro de ligação (Modo offline não ativo)" };
      setResult(errRes);
      playFeedback(false);
      window.setTimeout(() => setResult(null), 2000);
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
      const html5QrCode = new Html5Qrcode("reader-hidden");
      const result = await html5QrCode.scanFile(file, true);
      handleValidate(result);
    } catch (err: any) {
      const errRes = { success: false, resultType: "error", message: "Ups! QR Code ilegível na foto" };
      setResult(errRes);
      playFeedback(false);
      window.setTimeout(() => setResult(null), 2000);
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
          throw new Error("Permissão de câmara negada (Requer HTTPS).");
        }

        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        isScanningRef.current = false;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 15, qrbox: { width: 300, height: 300 } },
          (decodedText: string) => {
            // Only scan if not currently showing a result overlay
            setResult((current) => {
              if (!current) {
                // We use timeout to stop rapid consecutive fires on same code if React state lags
                setTimeout(() => handleValidate(decodedText), 50);
              }
              return current;
            });
          },
          () => { }
        );

        isScanningRef.current = true;
      } catch (err: any) {
        console.error("Error starting camera:", err);
        setCameraError("Erro ao iniciar a câmara. Use o modo manual.");
        setScanning(false);
      }
    };

    initScanner();
    return () => {
      stopScanner();
    };
  }, [scanning, handleValidate, stopScanner]);

  if (status === "loading") {
    return <div className="min-h-screen bg-black grid place-items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div></div>;
  }

  if (!session || (session.user.role !== "USER" && session.user.role !== "ADMIN")) {
    return (
      <div className="min-h-screen grid place-items-center px-4 bg-black">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-2xl">
          <Lock className="mx-auto h-16 w-16 text-white/30" />
          <h2 className="mt-4 text-2xl font-semibold text-white">Acesso restrito</h2>
          <Link href="/auth/signin" className="mt-6 block w-full rounded-full bg-white px-6 py-4 text-black font-bold">Iniciar sessão</Link>
        </div>
      </div>
    );
  }

  // Define Fullscreen Overlay dynamically based on result
  if (result) {
    const isSuccess = result.success;
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200",
        isSuccess ? "bg-emerald-500 text-white" : "bg-rose-600 text-white"
      )}>
        {isSuccess ? <CheckCircle className="h-32 w-32 mb-6 animate-bounce" /> : <XCircle className="h-32 w-32 mb-6 animate-pulse" />}
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4">
          {isSuccess ? "VÁLIDO" : "INVÁLIDO"}
        </h1>
        <p className="text-2xl md:text-3xl font-medium opacity-90">{result.message}</p>

        {result.ticketHolderName && (
          <div className="mt-8 px-8 py-4 bg-black/20 rounded-2xl backdrop-blur-md">
            <p className="text-sm uppercase opacity-75 font-semibold tracking-wider">Titular</p>
            <p className="text-3xl font-bold mt-1">{result.ticketHolderName}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pt-8 px-4 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Validar Entradas</h1>
          <p className="text-white/50 text-sm">Pronto para ler QR codes</p>
        </div>
        <button onClick={syncOfflineQueue} className="text-xs bg-white/10 px-4 py-2 rounded-full active:scale-95 transition-transform flex items-center gap-2">
          Sync Offline <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4 max-w-lg mx-auto w-full">
        {/* Scanner Viewport */}
        <div className="relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl flex-1 max-h-[60vh] flex flex-col">
          {scanning ? (
            <div id="reader" className="w-full h-full object-cover"></div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/40">
              <ScanLine className="w-20 h-20 mb-4 opacity-50" />
              <p>Câmara pendente</p>
            </div>
          )}

          {/* Overlay Frame */}
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none"></div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {!scanning ? (
            <button onClick={() => setScanning(true)} className="col-span-2 py-4 rounded-full bg-white text-black font-bold text-lg active:scale-95">
              Ligar Câmara
            </button>
          ) : (
            <button onClick={() => { stopScanner(); setScanning(false); }} className="col-span-2 py-4 rounded-full bg-white/10 text-white font-bold text-lg active:scale-95 border border-white/20">
              Pausar Câmara
            </button>
          )}
        </div>

        {/* Manual Validation & Offline Mode Helper */}
        <div className="mt-4 p-5 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-lg">
          <h3 className="text-xs font-semibold uppercase text-white/50 mb-3">Validação Manual</h3>
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="INTRODUZA CÓDIGO (ABC-123)"
              className="flex-1 rounded-xl bg-black/40 border border-white/10 px-4 text-white uppercase placeholder:normal-case font-mono"
            />
            <button onClick={handleManualValidate} className="px-6 py-3 rounded-xl bg-white/10 font-bold active:bg-white/20 transition-colors">
              Validar
            </button>
          </div>
        </div>

        {/* Hidden div for file scanning */}
        <div id="reader-hidden" style={{ display: "none" }}></div>
      </div>
    </div>
  );
}