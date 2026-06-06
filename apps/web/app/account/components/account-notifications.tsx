"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Prefs {
  notifyEmail: boolean;
  notifyEventReminders: boolean;
  notifyTransfers: boolean;
  marketingOptIn: boolean;
}

export default function AccountNotifications({ initialPrefs }: { initialPrefs: Prefs }) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/account/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ type: "error", message: data.error ?? "Erro ao guardar" });
        return;
      }
      setToast({ type: "success", message: "Preferências guardadas" });
    } catch {
      setToast({ type: "error", message: "Erro ao guardar preferências" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Notificações
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolhe como queres ser contactado.
        </p>
      </div>

      {toast && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
              : "bg-red-500/10 border-red-500/30 text-red-200"
            }`}
        >
          {toast.message}
        </div>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-background/50 p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-base font-medium text-foreground">Emails de conta</Label>
            <p className="text-sm text-muted-foreground">Confirmações de compra e bilhetes.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.notifyEmail}
            onClick={() => setPrefs((p) => ({ ...p, notifyEmail: !p.notifyEmail }))}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${prefs.notifyEmail ? "bg-primary border-primary" : "bg-neutral-200 border-neutral-300"
              }`}
            data-testid="switch-notify-email"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs.notifyEmail ? "translate-x-5" : "translate-x-0.5"
                }`}
              style={{ marginTop: 2 }}
            />
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-base font-medium text-foreground">Lembretes de eventos</Label>
            <p className="text-sm text-muted-foreground">Avisos antes do início do evento.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.notifyEventReminders}
            onClick={() => setPrefs((p) => ({ ...p, notifyEventReminders: !p.notifyEventReminders }))}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors ${prefs.notifyEventReminders ? "bg-primary border-primary" : "bg-neutral-200 border-neutral-300"
              }`}
            data-testid="switch-notify-reminders"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs.notifyEventReminders ? "translate-x-5" : "translate-x-0.5"
                }`}
              style={{ marginTop: 2 }}
            />
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-base font-medium text-foreground">Transferências</Label>
            <p className="text-sm text-muted-foreground">Avisos quando recebes ou envias bilhetes.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.notifyTransfers}
            onClick={() => setPrefs((p) => ({ ...p, notifyTransfers: !p.notifyTransfers }))}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors ${prefs.notifyTransfers ? "bg-primary border-primary" : "bg-neutral-200 border-neutral-300"
              }`}
            data-testid="switch-notify-transfers"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs.notifyTransfers ? "translate-x-5" : "translate-x-0.5"
                }`}
              style={{ marginTop: 2 }}
            />
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label className="text-base font-medium text-foreground">Marketing</Label>
            <p className="text-sm text-muted-foreground">Novidades e ofertas (opcional).</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={prefs.marketingOptIn}
            onClick={() => setPrefs((p) => ({ ...p, marketingOptIn: !p.marketingOptIn }))}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors ${prefs.marketingOptIn ? "bg-primary border-primary" : "bg-neutral-200 border-neutral-300"
              }`}
            data-testid="switch-marketing"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${prefs.marketingOptIn ? "translate-x-5" : "translate-x-0.5"
                }`}
              style={{ marginTop: 2 }}
            />
          </button>
        </div>
        <Button onClick={handleSave} disabled={saving} data-testid="save-notifications">
          {saving ? "A guardar…" : "Guardar preferências"}
        </Button>
      </section>
    </div>
  );
}
