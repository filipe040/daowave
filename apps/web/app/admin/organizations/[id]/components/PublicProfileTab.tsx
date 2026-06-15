"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { ExternalLink, Globe, Loader2, Save, Sparkles } from "lucide-react";
import { getAppBaseUrl } from "@/lib/company";

interface PublicProfileData {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  publicBio?: string | null;
  publicProfileEnabled: boolean;
  publicProfileEnabledAt?: string | null;
  publicProfileNote?: string | null;
}

interface Props {
  organizationId: string;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[14px] text-white placeholder:text-zinc-600 focus:border-[#00a0e3]/50 focus:outline-none transition-colors";

const labelClass = "block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-1.5";

export function PublicProfileTab({ organizationId }: Props) {
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<PublicProfileData>(
      `/api/admin/organizations/${organizationId}/public-profile`
    );
    if (res.error) toast.error(res.error);
    else if (res.data) setData(res.data);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    const res = await api.patch(`/api/admin/organizations/${organizationId}/public-profile`, {
      publicProfileEnabled: data.publicProfileEnabled,
      bannerUrl: data.bannerUrl ?? "",
      logoUrl: data.logoUrl ?? "",
      publicBio: data.publicBio ?? "",
      publicProfileNote: data.publicProfileNote ?? "",
    });
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Perfil público atualizado");
      if (res.data) setData(res.data as PublicProfileData);
    }
  };

  const set = <K extends keyof PublicProfileData>(key: K, value: PublicProfileData[K]) => {
    setData((d) => (d ? { ...d, [key]: value } : d));
  };

  if (loading) return <div className="p-6 text-sm text-zinc-500">A carregar…</div>;
  if (!data) return <div className="p-6 text-sm text-red-400">Não foi possível carregar o perfil.</div>;

  const profileUrl = `${getAppBaseUrl()}/org/${data.slug}`;

  return (
    <div className="space-y-6">
      <div className="dash-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-[#00a0e3]" />
              <h3 className="text-lg font-bold text-white">Perfil Público</h3>
            </div>
            <p className="text-sm text-zinc-500 max-w-xl leading-relaxed">
              Ativa o perfil público apenas para organizações que pagaram este serviço.
              A página ficará visível em{" "}
              <span className="text-zinc-400 font-mono text-xs">/org/{data.slug}</span> com banner,
              logótipo e lista de próximos eventos.
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer shrink-0 p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
            <input
              type="checkbox"
              checked={data.publicProfileEnabled}
              onChange={(e) => set("publicProfileEnabled", e.target.checked)}
              className="h-5 w-5 rounded border-white/20 accent-[#00a0e3]"
            />
            <div>
              <div className="text-sm font-bold text-white">Perfil ativo</div>
              <div className="text-[11px] text-zinc-500">
                {data.publicProfileEnabled ? "Visível publicamente" : "Desativado"}
              </div>
            </div>
          </label>
        </div>

        {data.publicProfileEnabled && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mb-8 text-sm font-bold text-[#00a0e3] hover:text-[#5ec8f8] transition-colors"
          >
            <Globe className="h-4 w-4" />
            Ver página pública
            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </a>
        )}

        {data.publicProfileEnabledAt && (
          <p className="text-[12px] text-zinc-600 mb-6">
            Ativado em {new Date(data.publicProfileEnabledAt).toLocaleString("pt-PT")}
          </p>
        )}

        <div className="grid gap-6">
          <div>
            <label className={labelClass}>Nota interna (só admin)</label>
            <textarea
              value={data.publicProfileNote ?? ""}
              onChange={(e) => set("publicProfileNote", e.target.value)}
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="Ex: Plano premium até dez/2026, fatura #1234"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>URL do banner</label>
              <input
                type="url"
                value={data.bannerUrl ?? ""}
                onChange={(e) => set("bannerUrl", e.target.value)}
                className={inputClass}
                placeholder="https://cdn.exemplo.pt/banner.jpg"
              />
            </div>
            <div>
              <label className={labelClass}>URL do logótipo</label>
              <input
                type="url"
                value={data.logoUrl ?? ""}
                onChange={(e) => set("logoUrl", e.target.value)}
                className={inputClass}
                placeholder="https://cdn.exemplo.pt/logo.png"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Descrição pública</label>
            <textarea
              value={data.publicBio ?? ""}
              onChange={(e) => set("publicBio", e.target.value)}
              className={`${inputClass} resize-none`}
              rows={3}
              maxLength={2000}
              placeholder="Breve descrição da organização visível no perfil"
            />
            <p className="text-[11px] text-zinc-600 mt-1 text-right">
              {(data.publicBio ?? "").length}/2000
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold bg-[#00a0e3] text-white hover:bg-[#0088c7] disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                A guardar…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar perfil
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
