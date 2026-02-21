"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { XCircle, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  if (!token) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px] text-center">
          <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <XCircle className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Token inválido</h1>
              <p className="text-[14px] text-white/50 leading-relaxed px-4">
                O link de recuperação é inválido ou expirou.
              </p>
            </div>
            <Button asChild className="w-full rounded-full bg-white text-black hover:bg-white/90">
              <Link href="/auth/forgot-password">Solicitar novo link</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("As palavras-passe não coincidem");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: formData.password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao redefinir palavra-passe");

      setSuccess(true);
      setTimeout(() => router.push("/auth/signin?passwordReset=true"), 2000);
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
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.5} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">Sucesso!</h1>
            <p className="text-[13px] sm:text-[14px] text-white/50">Palavra-passe redefinida. A redirecionar...</p>
            <Loader2 className="mx-auto h-5 w-5 sm:h-6 sm:w-6 animate-spin text-white/20" />
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
        <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight uppercase">Nova Palavra-passe</h1>
        <p className="mt-2 text-[13px] sm:text-[14px] text-white/45">Escolha uma nova senha para a sua conta</p>
      </div>

      <div className="w-full max-w-[400px]">
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[12px] sm:text-[13px] text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-[24px] sm:rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl font-sans">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-white/40 ml-1">
                Nova palavra-passe
              </Label>
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-white/10 bg-white/5 text-[13px] sm:text-[14px] text-white placeholder:text-white/20 focus-visible:ring-white/20 px-4"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-white/40 ml-1">
                Confirmar palavra-passe
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirme a nova senha"
                className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-white/10 bg-white/5 text-[13px] sm:text-[14px] text-white placeholder:text-white/20 focus-visible:ring-white/20 px-4"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 rounded-full mt-4 text-[13px] sm:text-[14px] font-bold bg-white text-black hover:bg-white/90 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "A processar..." : "Redefinir Palavra-passe"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white/10" /></div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}