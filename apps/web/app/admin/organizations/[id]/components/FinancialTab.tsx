"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { EnterpriseFinancialSettings, PromoterFinancialProfile } from "@/lib/finance/types";

interface Props {
  organizationId: string;
}

export function FinancialTab({ organizationId }: Props) {
  const [profile, setProfile] = useState<Partial<PromoterFinancialProfile>>({
    pricingMode: "GLOBAL",
    settlementFrequency: "MANUAL",
    active: true,
  });
  const [globalDefaults, setGlobalDefaults] = useState<EnterpriseFinancialSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<{ profile: PromoterFinancialProfile | null; globalDefaults: EnterpriseFinancialSettings }>(
      `/api/admin/organizations/${organizationId}/financial-settings`
    );
    if (res.data) {
      setGlobalDefaults(res.data.globalDefaults);
      if (res.data.profile) {
        setProfile(res.data.profile);
      } else {
        setProfile({
          organizationId,
          pricingMode: "GLOBAL",
          settlementFrequency: "MANUAL",
          active: true,
        });
      }
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    const res = await api.put(`/api/admin/organizations/${organizationId}/financial-settings`, {
      pricingMode: profile.pricingMode,
      customFixedFeeEuros: profile.customFixedFeeCents != null ? profile.customFixedFeeCents / 100 : null,
      customPercentageFee: profile.customPercentageFee,
      customMinimumFeeEuros: profile.customMinimumFeeCents != null ? profile.customMinimumFeeCents / 100 : null,
      customMaximumFeeEuros: profile.customMaximumFeeCents != null ? profile.customMaximumFeeCents / 100 : null,
      customOperationalReserveEuros:
        profile.customOperationalReserveCents != null ? profile.customOperationalReserveCents / 100 : null,
      feePaidBy: profile.feePaidBy,
      settlementFrequency: profile.settlementFrequency,
      active: profile.active,
      payoutDelayDays: profile.payoutDelayDays,
      reservePercentage: profile.reservePercentage,
    });
    setSaving(false);
    if (res.error) toast.error(res.error);
    else toast.success("Configuração financeira guardada");
  };

  if (loading) return <div className="p-6 text-sm text-zinc-500">A carregar…</div>;

  return (
    <div className="dash-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white">Configuração Financeira</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Define condições comerciais próprias ou usa a configuração global.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-bold text-zinc-500 uppercase">Modo de preços</span>
          <select
            className="mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
            value={profile.pricingMode ?? "GLOBAL"}
            onChange={(e) => setProfile({ ...profile, pricingMode: e.target.value as "GLOBAL" | "CUSTOM" })}
          >
            <option value="GLOBAL">Global (usa configuração da plataforma)</option>
            <option value="CUSTOM">Personalizado</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-zinc-500 uppercase">Quem paga as taxas</span>
          <select
            className="mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
            value={profile.feePaidBy ?? globalDefaults?.defaultFeePaidBy ?? "BUYER"}
            onChange={(e) => setProfile({ ...profile, feePaidBy: e.target.value as "BUYER" | "ORGANIZER" })}
          >
            <option value="BUYER">Comprador (BUYER)</option>
            <option value="ORGANIZER">Organizador (ORGANIZER)</option>
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-zinc-500 uppercase">Liquidação automática</span>
          <select
            className="mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
            value={profile.settlementFrequency ?? "MANUAL"}
            onChange={(e) =>
              setProfile({
                ...profile,
                settlementFrequency: e.target.value as PromoterFinancialProfile["settlementFrequency"],
              })
            }
          >
            <option value="MANUAL">Manual</option>
            <option value="DAILY">Diária</option>
            <option value="WEEKLY">Semanal</option>
            <option value="BIWEEKLY">Quinzenal</option>
            <option value="MONTHLY">Mensal</option>
          </select>
        </label>

        <label className="flex items-center gap-3 text-sm pt-6">
          <input
            type="checkbox"
            checked={profile.active ?? true}
            onChange={(e) => setProfile({ ...profile, active: e.target.checked })}
          />
          Perfil activo
        </label>
      </div>

      {profile.pricingMode === "CUSTOM" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-white/10 pt-6">
          <label className="block">
            <span className="text-xs font-bold text-zinc-500 uppercase">Taxa base (€)</span>
            <input
              type="number"
              step="0.01"
              className="mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
              value={(profile.customFixedFeeCents ?? 0) / 100}
              onChange={(e) =>
                setProfile({ ...profile, customFixedFeeCents: Math.round(Number(e.target.value) * 100) })
              }
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-zinc-500 uppercase">Percentagem (%)</span>
            <input
              type="number"
              step="0.01"
              className="mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
              value={profile.customPercentageFee ?? ""}
              onChange={(e) => setProfile({ ...profile, customPercentageFee: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-zinc-500 uppercase">Margem mínima (€)</span>
            <input
              type="number"
              step="0.01"
              className="mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
              value={(profile.customMinimumFeeCents ?? 0) / 100}
              onChange={(e) =>
                setProfile({ ...profile, customMinimumFeeCents: Math.round(Number(e.target.value) * 100) })
              }
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-zinc-500 uppercase">Taxa máxima (€)</span>
            <input
              type="number"
              step="0.01"
              className="mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
              value={profile.customMaximumFeeCents != null ? profile.customMaximumFeeCents / 100 : ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  customMaximumFeeCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null,
                })
              }
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-zinc-500 uppercase">Reserva operacional (€)</span>
            <input
              type="number"
              step="0.01"
              className="mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
              value={(profile.customOperationalReserveCents ?? 0) / 100}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  customOperationalReserveCents: Math.round(Number(e.target.value) * 100),
                })
              }
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-zinc-500 uppercase">Prazo libertação (dias)</span>
            <input
              type="number"
              className="mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm"
              value={profile.payoutDelayDays ?? globalDefaults?.pendingReleaseDays ?? 3}
              onChange={(e) => setProfile({ ...profile, payoutDelayDays: Number(e.target.value) })}
            />
          </label>
        </div>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="dash-btn-primary"
      >
        {saving ? "A guardar…" : "Guardar configuração"}
      </button>
    </div>
  );
}
