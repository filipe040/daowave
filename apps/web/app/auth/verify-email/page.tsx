"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { Loader2, XCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("");
  const verificationStarted = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const verified = searchParams.get("verified");

    if (verified === "true") {
      setStatus("success");
      setMessage("Email verificado com sucesso!");
      return;
    }

    if (error) {
      if (error === "expired_token") {
        setStatus("expired");
        setMessage("O link de verificação expirou. Por favor, solicite um novo.");
      } else {
        setStatus("error");
        setMessage("Link de verificação inválido.");
      }
      return;
    }

    if (!token) {
      setStatus("error");
      setMessage("Token de verificação não encontrado");
      return;
    }

    if (verificationStarted.current) return;
    verificationStarted.current = true;
    verifyEmail(token);
  }, [token, searchParams]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const res = await fetch(
        `/api/auth/verify-email?token=${encodeURIComponent(verificationToken)}`,
        { redirect: "manual" }
      );

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (location) {
          const url = new URL(location, window.location.origin);
          const error = url.searchParams.get("error");
          const verified = url.searchParams.get("verified");

          if (verified === "true") {
            setStatus("success");
            setMessage("Email verificado com sucesso!");
          } else if (error === "expired_token") {
            setStatus("expired");
            setMessage("O link de verificação expirou.");
          } else {
            setStatus("error");
            setMessage("Link inválido ou erro na verificação.");
          }
        }
      } else if (res.ok) {
        setStatus("success");
        setMessage("Email verificado com sucesso!");
      } else {
        setStatus("error");
        setMessage("Erro ao verificar email. Tente novamente.");
      }
    } catch {
      setStatus("error");
      setMessage("Erro de ligação. Tente novamente.");
    }
  };

  const handleResend = async () => {
    setMessage("Funcionalidade de reenvio em breve...");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-12 overflow-x-hidden">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-[400px] text-center">
        <div className="rounded-[24px] sm:rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl space-y-8 font-sans">

          {status === "loading" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-white/5">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-white/30" />
              </div>
              <div className="space-y-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight uppercase">A verificar email</h1>
                <p className="text-[13px] sm:text-[14px] text-white/50">Por favor, aguarde um momento...</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">Verificado!</h1>
                <p className="text-[13px] sm:text-[14px] text-zinc-400">{message}</p>
              </div>
              <Button asChild className="w-full h-11 sm:h-12 rounded-full bg-white text-black font-bold hover:bg-white/90 transition-all">
                <Link href="/auth/signin">Entrar agora</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <XCircle className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">Erro no Link</h1>
                <p className="text-[13px] sm:text-[14px] text-zinc-400 leading-relaxed px-2 sm:px-4">{message}</p>
              </div>
              <Button asChild variant="outline" className="w-full h-11 sm:h-12 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white">
                <Link href="/auth/signin">Voltar ao Login</Link>
              </Button>
            </div>
          )}

          {status === "expired" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">Link Expirado</h1>
                <p className="text-[13px] sm:text-[14px] text-zinc-400">{message}</p>
              </div>
              <div className="space-y-3 pt-2">
                <Button onClick={handleResend} className="w-full h-11 sm:h-12 rounded-full bg-white text-black font-bold hover:bg-white/90">
                  Reenviar email
                </Button>
                <Button asChild variant="ghost" className="w-full h-11 sm:h-12 rounded-full text-white/50 hover:text-white">
                  <Link href="/auth/signin">Voltar ao Login</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen mesh-gradient text-neutral-900 selection:bg-white selection:text-black font-sans">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/10" />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
