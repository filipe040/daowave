"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Tag,
  Save,
  Trash2,
  Loader2,
  ShieldAlert,
  Plus,
  Pencil,
  ArrowLeft,
  Euro,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toDatetimeLocalLisbon } from "@/lib/datetime/lisbon";

const inputCls = "public-input px-5 py-3 text-sm";
const labelCls = "public-label mb-2";

interface EventOption {
  id: string;
  title: string;
}

interface TeamMemberOption {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string };
}

interface CommissionStats {
  totalCommissionCents: number;
  commissionCount: number;
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
  assignedMemberId: string | null;
  commissionCents: number | null;
  event?: { title: string; slug: string };
  assignedMember?: {
    id: string;
    user: { name: string | null; email: string };
  } | null;
  commissionStats?: CommissionStats;
}

type ViewMode = "list" | "create" | "edit";

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function formatDiscount(coupon: CouponData) {
  if (coupon.discountType === "PERCENTAGE") return `${coupon.discountValue}%`;
  return formatEuro(coupon.discountValue);
}

function toDatetimeLocal(iso: string) {
  return toDatetimeLocalLisbon(iso);
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
    startsAt: toDatetimeLocalLisbon(now.toISOString()),
    endsAt: toDatetimeLocalLisbon(in30.toISOString()),
    isActive: true,
    assignedMemberId: "",
    commissionEuros: 2,
  };
}

function couponToForm(c: CouponData) {
  return {
    eventId: c.eventId,
    code: c.code,
    discountType: c.discountType,
    discountValuePercent: c.discountType === "PERCENTAGE" ? c.discountValue : 10,
    discountValueEuros: c.discountType === "FIXED" ? c.discountValue / 100 : 5,
    maxUses: c.maxUses != null ? String(c.maxUses) : "",
    startsAt: toDatetimeLocal(c.startsAt),
    endsAt: toDatetimeLocal(c.endsAt),
    isActive: c.isActive,
    assignedMemberId: c.assignedMemberId ?? "",
    commissionEuros: c.commissionCents ? c.commissionCents / 100 : 2,
  };
}

function CouponForm({
  mode,
  coupon,
  events,
  members,
  canManage,
  onSaved,
  onCancel,
  onDeleted,
}: {
  mode: "create" | "edit";
  coupon: CouponData | null;
  events: EventOption[];
  members: TeamMemberOption[];
  canManage: boolean;
  onSaved: () => void;
  onCancel: () => void;
  onDeleted?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(() =>
    mode === "edit" && coupon ? couponToForm(coupon) : emptyForm()
  );

  const readOnly = !canManage;
  const isEdit = mode === "edit";

  const buildPayload = () => {
    const assignedMemberId = form.assignedMemberId || null;
    return {
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
      assignedMemberId,
      commissionCents: assignedMemberId
        ? Math.round(form.commissionEuros * 100)
        : null,
    };
  };

  const validateAssignment = (): string | null => {
    if (form.assignedMemberId && (!form.commissionEuros || form.commissionEuros <= 0)) {
      return "Indique a comissão em € para o promotor selecionado.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignmentError = validateAssignment();
    if (assignmentError) {
      toast.error(assignmentError);
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const res =
        mode === "create"
          ? await fetch("/api/promotor/coupons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/promotor/coupons/${coupon!.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                (() => {
                  const { code: _code, ...rest } = payload;
                  return rest;
                })()
              ),
            });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao guardar cupão");
      toast.success(mode === "create" ? "Cupão criado" : "Cupão atualizado");
      onSaved();
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
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar cupão");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-[#0c0c12] border border-white/10 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <h2 className="text-lg font-bold text-white">
          {isEdit ? `Editar cupão ${coupon?.code}` : "Novo cupão"}
        </h2>
      </div>

      {isEdit && coupon?.assignedMemberId && coupon.commissionStats && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 flex gap-3">
          <Euro className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800">
            Comissões acumuladas:{" "}
            <strong>{formatEuro(coupon.commissionStats.totalCommissionCents)}</strong> (
            {coupon.commissionStats.commissionCount} utilizações)
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="JOAO2025"
            maxLength={20}
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5/80 p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-white">Promotor e comissão</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Crie um cupão por promotor — cada código gera comissão em € para o membro
              selecionado.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className={labelCls}>Promotor da equipa</Label>
              <select
                disabled={readOnly}
                value={form.assignedMemberId}
                onChange={(e) => setForm({ ...form, assignedMemberId: e.target.value })}
                className={inputCls}
              >
                <option value="">Nenhum (sem comissão)</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user.name || member.user.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className={labelCls}>Comissão por utilização (€)</Label>
              <Input
                type="number"
                disabled={readOnly || !form.assignedMemberId}
                min={0.01}
                step={0.01}
                value={form.commissionEuros}
                onChange={(e) =>
                  setForm({
                    ...form,
                    commissionEuros: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
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
              Valor *{form.discountType === "PERCENTAGE" ? " (%)" : " (€)"}
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
                  setForm({
                    ...form,
                    discountValuePercent: parseInt(e.target.value, 10) || 0,
                  })
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
                  setForm({
                    ...form,
                    discountValueEuros: parseFloat(e.target.value) || 0,
                  })
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
          <label className="flex items-center gap-2 text-sm text-zinc-300">
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
  );
}

export function OrganizationCouponEditor() {
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [view, setView] = useState<ViewMode>("list");
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [couponRes, eventsRes, teamRes] = await Promise.all([
        fetch("/api/promotor/coupons"),
        fetch("/api/promotor/events?select=all"),
        fetch("/api/promotor/team"),
      ]);

      const couponData = couponRes.ok ? await couponRes.json() : null;
      const eventsData = eventsRes.ok ? await eventsRes.json() : null;
      const teamData = teamRes.ok ? await teamRes.json() : null;

      setCanManage(!!couponData?.canManage);
      setCoupons(couponData?.coupons ?? []);
      setEvents(eventsData?.events ?? []);
      setMembers(teamData?.data ?? []);
    } catch {
      toast.error("Erro ao carregar cupões");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = async () => {
    await load();
    setView("list");
    setEditingCoupon(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
        A carregar...
      </div>
    );
  }

  if (!canManage && coupons.length === 0) {
    return (
      <div className="max-w-xl bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
        <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-white mb-1">Sem cupões configurados</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Apenas o proprietário da organização ou um administrador pode criar cupões e
            atribuí-los a promotores da equipa.
          </p>
        </div>
      </div>
    );
  }

  if (view === "create") {
    return (
      <CouponForm
        mode="create"
        coupon={null}
        events={events}
        members={members}
        canManage={canManage}
        onSaved={handleSaved}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "edit" && editingCoupon) {
    return (
      <CouponForm
        mode="edit"
        coupon={editingCoupon}
        events={events}
        members={members}
        canManage={canManage}
        onSaved={handleSaved}
        onCancel={() => {
          setView("list");
          setEditingCoupon(null);
        }}
        onDeleted={handleSaved}
      />
    );
  }

  const totalCommissions = coupons.reduce(
    (sum, c) => sum + (c.commissionStats?.totalCommissionCents ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">
            {coupons.length} cupão{coupons.length !== 1 ? "ões" : ""}
            {totalCommissions > 0 && (
              <span className="ml-2 text-emerald-700">
                · {formatEuro(totalCommissions)} em comissões totais
              </span>
            )}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setView("create")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo cupão
          </Button>
        )}
      </div>

      {coupons.length === 0 ? (
        <div className="bg-[#14141f] border border-dashed border-neutral-300 rounded-2xl p-10 text-center">
          <Tag className="h-8 w-8 text-zinc-500 mx-auto mb-3" />
          <p className="text-zinc-400 mb-4">Ainda não há cupões. Crie um para cada promotor.</p>
          {canManage && (
            <Button onClick={() => setView("create")}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeiro cupão
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {coupons.map((coupon) => {
            const promoterName =
              coupon.assignedMember?.user.name ||
              coupon.assignedMember?.user.email ||
              null;

            return (
              <div
                key={coupon.id}
                className="bg-[#0c0c12] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-white">{coupon.code}</span>
                    <Badge variant={coupon.isActive ? "success" : "muted"}>
                      {coupon.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                    <span className="text-sm text-[#5ec8f8] font-medium">
                      {formatDiscount(coupon)} desconto
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">
                    {coupon.event?.title ?? "Evento"}
                    {promoterName && (
                      <span className="text-zinc-500">
                        {" "}
                        · Promotor: <strong className="text-zinc-300">{promoterName}</strong>
                        {coupon.commissionCents != null && (
                          <span> ({formatEuro(coupon.commissionCents)}/uso)</span>
                        )}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {coupon.usedCount}
                    {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""} utilizações
                    {(coupon.commissionStats?.totalCommissionCents ?? 0) > 0 && (
                      <span className="text-emerald-700 ml-2">
                        · {formatEuro(coupon.commissionStats!.totalCommissionCents)} comissões
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingCoupon(coupon);
                    setView("edit");
                  }}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  {canManage ? "Editar" : "Ver"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
