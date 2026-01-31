"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SessionItem {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
}

export default function AccountSecurity() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeAllLoading, setRevokeAllLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/account/sessions")
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data.sessions) setSessions(data.sessions);
      })
      .catch(() => mounted && setToast({ type: "error", message: "Erro ao carregar sessões" }))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const res = await fetch("/api/account/sessions/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: "error", message: data.error ?? "Erro ao revogar" });
        return;
      }
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, revokedAt: new Date().toISOString() } : s)));
      setToast({ type: "success", message: "Sessão terminada" });
    } catch {
      setToast({ type: "error", message: "Erro ao revogar sessão" });
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokeAllLoading(true);
    try {
      const res = await fetch("/api/account/sessions/revoke-all", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: "error", message: data.error ?? "Erro ao terminar sessões" });
        return;
      }
      setSessions((prev) => prev.map((s) => ({ ...s, revokedAt: new Date().toISOString() })));
      setToast({ type: "success", message: "Todas as sessões foram terminadas" });
    } catch {
      setToast({ type: "error", message: "Erro ao terminar sessões" });
    } finally {
      setRevokeAllLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setToast({ type: "error", message: "As palavras-passe não coincidem" });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: "error", message: data.error ?? "Erro ao alterar palavra-passe" });
        return;
      }
      setToast({ type: "success", message: "Palavra-passe alterada" });
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch {
      setToast({ type: "error", message: "Erro ao alterar palavra-passe" });
    } finally {
      setSavingPassword(false);
    }
  };

  const activeSessions = sessions.filter((s) => !s.revokedAt);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Segurança
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sessões ativas e alteração de palavra-passe.
        </p>
      </div>

      {toast && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : "bg-red-500/10 border-red-500/30 text-red-200"
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-foreground">Sessões ativas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Termina sessões em outros dispositivos. A sessão atual mantém-se ativa.
        </p>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">A carregar…</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {activeSessions.length === 0 ? (
              <li className="text-sm text-muted-foreground">Nenhuma sessão ativa para listar.</li>
            ) : (
              activeSessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3"
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">{s.ip ?? "—"}</span>
                    <span className="mx-2 text-zinc-600">·</span>
                    <span className="text-foreground/80 truncate max-w-[200px]">{s.userAgent ?? "—"}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!!revoking}
                    onClick={() => handleRevoke(s.id)}
                    data-testid="revoke-session"
                  >
                    {revoking === s.id ? "A terminar…" : "Terminar sessão"}
                  </Button>
                </li>
              ))
            )}
          </ul>
        )}
        {activeSessions.length > 1 && (
          <Button
            type="button"
            variant="destructive"
            className="mt-4"
            disabled={revokeAllLoading}
            onClick={handleRevokeAll}
            data-testid="revoke-all-sessions"
          >
            {revokeAllLoading ? "A terminar…" : "Terminar todas as outras sessões"}
          </Button>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-foreground">Alterar palavra-passe</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Usa uma palavra-passe forte com pelo menos 8 caracteres.
        </p>
        <form onSubmit={handlePasswordChange} className="mt-4 max-w-md space-y-4">
          <div>
            <Label htmlFor="current-password">Palavra-passe atual</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
              className="mt-2 border-zinc-700 bg-zinc-950"
            />
          </div>
          <div>
            <Label htmlFor="new-password">Nova palavra-passe</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordForm.new}
              onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
              className="mt-2 border-zinc-700 bg-zinc-950"
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirmar nova palavra-passe</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
              className="mt-2 border-zinc-700 bg-zinc-950"
            />
          </div>
          <Button type="submit" disabled={savingPassword} data-testid="save-password">
            {savingPassword ? "A guardar…" : "Guardar palavra-passe"}
          </Button>
        </form>
      </section>
    </div>
  );
}
