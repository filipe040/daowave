"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { ExternalLink, Globe, Loader2, Save, ShieldAlert, Sparkles } from "lucide-react";
import { getAppBaseUrl } from "@/lib/company";

interface PublicProfileData {
  slug: string;
  name: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  publicBio?: string | null;
  publicProfileEnabled: boolean;
  website?: string | null;
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[14px] text-white placeholder:text-zinc-600 focus:border-[#00a0e3]/50 focus:outline-none transition-colors";

const labelClass = "block text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-1.5";

export default function PromoterSettingsPage() {
  const [data, setData] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<PublicProfileData>("/api/promotor/public-profile");
    if (res.data) setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    const res = await api.patch("/api/promotor/public-profile", {
      bannerUrl: data.bannerUrl ?? "",
      logoUrl: data.logoUrl ?? "",
      publicBio: data.publicBio ?? "",
    });
    setSaving(false);
    if (res.error) toast.error(res.error);
    else {
      toast.success("Perfil guardado");
      if (res.data) setData(res.data as PublicProfileData);
    }
  };

  if (loading) {
    return (
      <PageShell title="Configurações" subtitle="Definições da organização">
        <div className="text-sm text-zinc-500">A carregar…</div>
      </PageShell>
    );
  }

  if (!data?.publicProfileEnabled) {
    return (
      <PageShell title="Configurações" subtitle="Definições da organização">
        <div className="max-w-xl">
          <div className="bg-amber-400/5 backdrop-blur-xl rounded-3xl border border-amber-400/20 p-8 flex flex-col items-start gap-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-400/10 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white mb-1">Perfil público não ativo</h2>
              <p className="text-sm text-zinc-500 leading-relaxed">
                O perfil público da organização é um serviço premium atribuído pelo administrador
                da plataforma. Quando estiver ativo, poderás editar o banner, logótipo e descrição
                aqui.
              </p>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  const profileUrl = `${getAppBaseUrl()}/org/${data.slug}`;

  return (
    <PageShell title="Configurações" subtitle="Perfil público da organização">
      <div className="max-w-2xl space-y-6">
        <div className="dash-card p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-[#00a0e3]" />
            <h2 className="text-lg font-bold text-white">Perfil público</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-6">
            Personaliza como a tua organização aparece na página pública.
          </p>

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

          <div className="space-y-5">
            <div>
              <label className={labelClass}>URL do banner</label>
              <input
                type="url"
                value={data.bannerUrl ?? ""}
                onChange={(e) => setData({ ...data, bannerUrl: e.target.value })}
                className={inputClass}
                placeholder="https://cdn.exemplo.pt/banner.jpg"
              />
            </div>
            <div>
              <label className={labelClass}>URL do logótipo</label>
              <input
                type="url"
                value={data.logoUrl ?? ""}
                onChange={(e) => setData({ ...data, logoUrl: e.target.value })}
                className={inputClass}
                placeholder="https://cdn.exemplo.pt/logo.png"
              />
            </div>
            <div>
              <label className={labelClass}>Descrição</label>
              <textarea
                value={data.publicBio ?? ""}
                onChange={(e) => setData({ ...data, publicBio: e.target.value })}
                className={`${inputClass} resize-none`}
                rows={3}
                maxLength={2000}
                placeholder="Breve descrição da organização"
              />
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
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
