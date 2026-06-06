"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Tag, Save, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const inputCls = "public-input px-5 py-3 text-sm";
const labelCls = "public-label mb-2";

interface EventOption {
  id: string;
  title: string;
}

interface CouponData {
  id: string;
  code: string;
  eventId: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  event?: { title: string; slug: string };
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function emptyForm() {
  const now = new Date();
  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);
  return {
    eventId: "",
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    discountValuePercent: 10,
    discountValueEuros: 5,
    maxUses: "",
    startsAt: toDatetimeLocal(now.toISOString()),
    endsAt: toDatetimeLocal(in30.toISOString()),
    isActive: true,
  };
}

export function OrganizationCouponEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [couponRes, eventsRes] = await Promise.all([
        fetch("/api/promotor/coupons"),
        fetch("/api/promotor/events?select=all"),
      ]);

      const couponData = couponRes.ok ? await couponRes.json() : null;
      const eventsData = eventsRes.ok ? await eventsRes.json() : null;

      setCanManage(!!couponData?.canManage);
      setEvents(eventsData?.events ?? []);

      const c = couponData?.coupon as CouponData | null;
      setCoupon(c ?? null);

      if (c) {
        setForm({
          eventId: c.eventId,
          code: c.code,
          discountType: c.discountType,
          discountValuePercent: c.discountType === "PERCENTAGE" ? c.discountValue : 10,
          discountValueEuros: c.discountType === "FIXED" ? c.discountValue / 100 : 5,
          maxUses: c.maxUses != null ? String(c.maxUses) : "",
          startsAt: toDatetimeLocal(c.startsAt),
          endsAt: toDatetimeLocal(c.endsAt),
          isActive: c.isActive,
        });
      } else {
        setForm(emptyForm());
      }
    } catch {
      toast.error("Erro ao carregar cupão");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const buildPayload = () => ({
    eventId: form.eventId,
    code: form.code.toUpperCase().replace(/\s/g, ""),
    discountType: form.discountType,
    discountValue:
      form.discountType === "PERCENTAGE"
        ? form.discountValuePercent
        : Math.round(form.discountValueEuros * 100),
    maxUses: form.maxUses ? parseInt(form.maxUses, 10) : null,
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    isActive: form.isActive,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/promotor/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar cupão");
      toast.success("Cupão criado com sucesso");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar cupão");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupon) return;
    setSaving(true);
    try {
      const { code: _code, ...rest } = buildPayload();
      const res = await fetch(`/api/promotor/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao guardar cupão");
      toast.success("Cupão atualizado");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar cupão");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!coupon || !confirm("Eliminar este cupão? Esta ação não pode ser desfeita.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/promotor/coupons/${coupon.id}`, { method: "DELETE" });
      const data = res.ok ? null : await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro ao eliminar cupão");
      toast.success("Cupão eliminado");
      setCoupon(null);
      setForm(emptyForm());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar cupão");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-neutral-500 py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
        A carregar...
      </div>
    );
  }

  if (!canManage && !coupon) {
    return (
      <div className="max-w-xl bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
        <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-neutral-900 mb-1">Sem cupão configurado</h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Cada organização pode ter um cupão de desconto. Apenas o proprietário da organização
            ou um administrador da plataforma pode criar e atribuir o cupão a um evento.
          </p>
        </div>
      </div>
    );
  }

  const readOnly = !canManage && !!coupon;
  const isEdit = !!coupon;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Tag className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">
              {isEdit ? "Cupão da organização" : "Criar cupão de desconto"}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Cada promotor tem direito a um cupão, atribuído a um evento específico.
              {coupon && (
                <span className="block mt-1">
                  Utilizações: {coupon.usedCount}
                  {coupon.maxUses != null ? ` / ${coupon.maxUses}` : " (ilimitado)"}
                </span>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={isEdit ? handleUpdate : handleCreate} className="space-y-5">
          <div>
            <Label className={labelCls}>Evento *</Label>
            <select
              required
              disabled={readOnly}
              value={form.eventId}
              onChange={(e) => setForm({ ...form, eventId: e.target.value })}
              className={inputCls}
            >
              <option value="">Selecione um evento</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              O cupão só funciona no checkout deste evento.
            </p>
          </div>

          <div>
            <Label className={labelCls}>Código do cupão *</Label>
            <Input
              required
              disabled={isEdit || readOnly}
              value={form.code}
              onChange={(e) =>
                setForm({
                  ...form,
                  code: e.target.value.toUpperCase().replace(/\s/g, ""),
                })
              }
              className="font-mono uppercase"
              placeholder="VERAO2025"
              maxLength={20}
            />
            {!isEdit && (
              <p className="text-xs text-neutral-500 mt-1">
                Apenas letras maiúsculas e números (máx. 20)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={labelCls}>Tipo de desconto *</Label>
              <select
                disabled={readOnly}
                value={form.discountType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    discountType: e.target.value as "PERCENTAGE" | "FIXED",
                  })
                }
                className={inputCls}
              >
                <option value="PERCENTAGE">Percentagem (%)</option>
                <option value="FIXED">Valor fixo (€)</option>
              </select>
            </div>
            <div>
              <Label className={labelCls}>
                Valor *
                {form.discountType === "PERCENTAGE" ? " (%)" : " (€)"}
              </Label>
              {form.discountType === "PERCENTAGE" ? (
                <Input
                  type="number"
                  required
                  disabled={readOnly}
                  min={1}
                  max={100}
                  value={form.discountValuePercent}
                  onChange={(e) =>
                    setForm({ ...form, discountValuePercent: parseInt(e.target.value, 10) || 0 })
                  }
                />
              ) : (
                <Input
                  type="number"
                  required
                  disabled={readOnly}
                  min={0.01}
                  step={0.01}
                  value={form.discountValueEuros}
                  onChange={(e) =>
                    setForm({ ...form, discountValueEuros: parseFloat(e.target.value) || 0 })
                  }
                />
              )}
            </div>
          </div>

          <div>
            <Label className={labelCls}>Limite de utilizações (opcional)</Label>
            <Input
              type="number"
              disabled={readOnly}
              min={1}
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              placeholder="Ilimitado se vazio"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={labelCls}>Início *</Label>
              <Input
                type="datetime-local"
                required
                disabled={readOnly}
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>
            <div>
              <Label className={labelCls}>Fim *</Label>
              <Input
                type="datetime-local"
                required
                disabled={readOnly}
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </div>
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                disabled={readOnly}
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-neutral-300"
              />
              Cupão ativo
            </label>
          )}

          {canManage && (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={saving || deleting}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isEdit ? "Guardar alterações" : "Criar cupão"}
              </Button>
              {isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving || deleting}
                  onClick={handleDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
