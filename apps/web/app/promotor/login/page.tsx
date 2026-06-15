"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function PromoterLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Credenciais inválidas");
        setLoading(false);
        return;
      }

      // Check user role and redirect
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const userRole = sessionData?.user?.role;
        const hasOrgAccess = sessionData?.user?.hasOrgAccess === true;

        if (hasOrgAccess) {
          router.push("/promotor");
          return;
        }

        if (
          userRole === "ADMIN" ||
          userRole === "FINANCE_MANAGER" ||
          userRole === "SUPPORT_AGENT"
        ) {
          setError("Use o painel de administração em /admin");
          setLoading(false);
          return;
        }

        setError("Acesso restrito a promotores");
        setLoading(false);
      } catch {
        router.push("/promotor");
      }
    } catch {
      setError("Erro ao fazer login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 sm:mb-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-[var(--elevation-1)]">
              <div className="grid grid-cols-2 gap-1">
                <span className="h-2.5 w-2.5 rounded-sm bg-foreground/90" />
                <span className="h-2.5 w-2.5 rounded-sm bg-foreground/90" />
                <span className="h-2.5 w-2.5 rounded-sm bg-foreground/90" />
                <span className="h-2.5 w-2.5 rounded-sm bg-foreground/90" />
              </div>
            </div>

            <div className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              Acesso ao Estúdio
            </div>

            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              EASY<span className="text-foreground/70">TICKET</span>
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Login para promotores e admins.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-2xl shadow-[0_18px_60px_rgba(0,0,0,.45)]">
            <div className="p-6 sm:p-8">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Credenciais</div>
                  <h2 className="mt-1 text-[18px] font-semibold text-foreground">Entrar</h2>
                </div>

                <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
                  Studio
                </span>
              </div>

              {error && (
                <div className="mb-5 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                  <div className="font-semibold text-destructive">Erro</div>
                  <div className="text-foreground/80">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@dominio"
                      required
                      autoComplete="email"
                      className={cn(
                        "w-full rounded-2xl border border-border bg-background/40",
                        "px-10 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/70",
                        "outline-none transition",
                        "focus:border-ring focus:ring-2 focus:ring-ring/20"
                      )}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-[11px] uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className={cn(
                        "w-full rounded-2xl border border-border bg-background/40",
                        "px-10 pr-12 py-3 text-[14px] text-foreground placeholder:text-muted-foreground/70",
                        "outline-none transition",
                        "focus:border-ring focus:ring-2 focus:ring-ring/20"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2",
                        "h-9 w-9 rounded-xl border border-border bg-secondary",
                        "text-muted-foreground hover:text-foreground transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      )}
                      aria-label={showPassword ? "Ocultar password" : "Mostrar password"}
                    >
                      {showPassword ? <EyeOff className="mx-auto h-4 w-4" /> : <Eye className="mx-auto h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl",
                    "bg-primary px-5 py-3.5 text-[13px] font-semibold text-primary-foreground",
                    "shadow-[0_18px_60px_rgba(0,0,0,.25)] transition",
                    "hover:opacity-95 active:scale-[0.99]",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                >
                  {loading ? "A entrar…" : "Entrar no sistema"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>

                {/* Links */}
                <div className="mt-4 flex items-center justify-between text-[12px]">
                  <Link
                    href="/auth/forgot-password"
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    Recuperar password
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    Novas credenciais
                  </Link>
                </div>
              </form>
            </div>

            {/* Footer strip */}
            <div className="flex items-center justify-between border-t border-border px-6 py-4 text-[11px] text-muted-foreground">
              <div className="flex flex-col">
                <span>TERMINAL • V4.0.0</span>
                <span>SECURE SESSION</span>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            </div>
          </div>

          {/* Bottom note */}
          <div className="mt-6 text-center text-[12px] text-muted-foreground">
            Se não tens permissões, fala com um admin.
          </div>
        </div>
      </div>
    </div>
  );
}