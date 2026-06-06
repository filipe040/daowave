"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ForgotPasswordContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao solicitar recuperação");

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[400px] text-center">
          <div className="rounded-[24px] sm:rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <Mail className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">Email enviado!</h1>
              <p className="text-[13px] sm:text-[14px] text-white/50 leading-relaxed px-2 sm:px-4">
                Enviámos instruções de recuperação para <span className="text-white font-medium">{email}</span>.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[11px] sm:text-[12px] text-white/30 mb-6">
                Verifique a sua caixa de entrada e a pasta de spam.
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-[13px] sm:text-[14px] font-bold text-black hover:bg-white/90 transition-all font-sans"
              >
                Voltar ao Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-12 overflow-x-hidden">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-white/5 blur-[120px]" />
      </div>

      <div className="mb-8 text-center w-full max-w-[400px]">
        <Link href="/auth/signin" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-6 text-[11px] sm:text-[13px] uppercase tracking-widest font-bold">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Login
        </Link>
        <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight uppercase">Recuperar Conta</h1>
        <p className="mt-2 text-[13px] sm:text-[14px] text-white/45">Insira o seu email para receber instruções</p>
      </div>

      <div className="w-full max-w-[400px]">
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] sm:text-[13px] text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-[24px] sm:rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl font-sans">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-white/40 ml-1">
                Endereço de Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-white/10 bg-white/5 text-[13px] sm:text-[14px] text-white placeholder:text-white/20 focus-visible:ring-white/20 px-4"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 rounded-full text-[13px] sm:text-[14px] font-bold bg-white text-black hover:bg-white/90 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "A enviar..." : "Enviar instruções"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen mesh-gradient text-neutral-900 selection:bg-white selection:text-black font-sans">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white/10" /></div>}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}
