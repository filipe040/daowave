"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, Suspense } from "react";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignUpContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar conta");

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
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <h1 className="text-lg sm:text-xl font-bold text-white uppercase tracking-tight">Conta criada!</h1>
              <p className="text-[13px] sm:text-[14px] text-white/50 leading-relaxed px-2 sm:px-4">
                Enviamos um email de verificação para <span className="text-white font-medium">{formData.email}</span>.
              </p>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[11px] sm:text-[12px] text-white/30 mb-6">
                Por favor, siga a ligação no email para ativar a sua conta.
              </p>
              <Link
                href="/auth/signin"
                className="inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 text-[13px] sm:text-[14px] font-bold text-black hover:bg-white/90 transition-all"
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
        <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight uppercase">Criar Conta</h1>
        <p className="mt-2 text-[13px] sm:text-[14px] text-white/45">Junte-se à maior rede de eventos em Portugal</p>
      </div>

      <div className="w-full max-w-[400px]">
        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[12px] sm:text-[13px] text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-[24px] sm:rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-white/40 ml-1">
                Nome completo
              </Label>
              <Input
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Maria Santos"
                className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-white/10 bg-white/5 text-[13px] sm:text-[14px] text-white placeholder:text-white/20 focus-visible:ring-white/20 px-4"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-white/40 ml-1">
                Endereço de Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="exemplo@email.com"
                className="h-11 sm:h-12 rounded-xl sm:rounded-2xl border-white/10 bg-white/5 text-[13px] sm:text-[14px] text-white placeholder:text-white/20 focus-visible:ring-white/20 px-4"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="block text-[10px] sm:text-[11px] uppercase tracking-wider text-white/40 ml-1">
                Palavra-passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="h-11 sm:h-12 pr-12 rounded-xl sm:rounded-2xl border-white/10 bg-white/5 text-[13px] sm:text-[14px] text-white placeholder:text-white/20 focus-visible:ring-white/20 px-4"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 rounded-full mt-4 text-[13px] sm:text-[14px] font-bold bg-white text-black hover:bg-white/90 hover:shadow-[0_8px_32px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? "A processar..." : "Criar Conta"}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-[13px] sm:text-[14px] text-white/40">
            Já tem uma conta?{" "}
            <Link href="/auth/signin" className="text-white hover:text-white/80 font-bold transition-all underline underline-offset-4">
              Entrar agora
            </Link>
          </p>
          <p className="text-[10px] sm:text-[11px] text-white/20 leading-relaxed px-6">
            Ao registar-se, aceita os nossos{" "}
            <Link href="/terms" className="underline hover:text-white/40">Termos</Link>{" "}
            e a nossa{" "}
            <Link href="/privacy" className="underline hover:text-white/40">Política de Privacidade</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-white/10" /></div>}>
        <SignUpContent />
      </Suspense>
    </div>
  );
}
