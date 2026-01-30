"use client";

import { useState } from "react";
import Link from "next/link";
import PromoterSidebar from "../../../../components/promoter-sidebar";
import Breadcrumbs from "@/app/components/breadcrumbs";

const TABS = [
  { id: "identidade", label: "IDENTIDADE", icon: "fingerprint" },
  { id: "landing", label: "LANDING PAGE", icon: "desktop" },
  { id: "dominios", label: "DOMÍNIOS", icon: "globe" },
  { id: "comunicacao", label: "COMUNICAÇÃO", icon: "envelope" },
  { id: "hardware", label: "HARDWARE", icon: "device" },
] as const;

const DEFAULT_PRIMARY = "#6C2BD9";
const DEFAULT_SECONDARY = "#06B6D4";

interface Event {
  id: string;
  title: string;
  slug: string;
  // Branding (Editor de Marca)
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  fontFamily: string | null;
  // Landing Page
  landingPageContent: string | null;
  useCustomLandingPage: boolean;
}

interface BrandingContentProps {
  event: Event;
}

export default function BrandingContent({ event }: BrandingContentProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("identidade");
  
  // Branding state (Editor de Marca)
  const [primaryColor, setPrimaryColor] = useState(event.primaryColor ?? DEFAULT_PRIMARY);
  const [secondaryColor, setSecondaryColor] = useState(event.secondaryColor ?? DEFAULT_SECONDARY);
  const [logoUrl, setLogoUrl] = useState(event.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(event.bannerUrl ?? "");
  const [fontFamily, setFontFamily] = useState(event.fontFamily ?? "");
  
  // Landing Page state
  const [landingPageContent, setLandingPageContent] = useState(event.landingPageContent ?? "");
  const [useCustomLandingPage, setUseCustomLandingPage] = useState(event.useCustomLandingPage);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSynchronize = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const body: Record<string, any> = {};
      
      if (activeTab === "identidade") {
        // Salvar branding (Editor de Marca)
        body.primaryColor = primaryColor || null;
        body.secondaryColor = secondaryColor || null;
        body.logoUrl = logoUrl.trim() || null;
        body.bannerUrl = bannerUrl.trim() || null;
        body.fontFamily = fontFamily.trim() || null;
      } else if (activeTab === "landing") {
        // Salvar landing page
        body.landingPageContent = landingPageContent;
        body.useCustomLandingPage = useCustomLandingPage;
      }
      
      const res = await fetch(`/api/promotor/events/${event.id}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao guardar");
      }
      setMessage({ type: "success", text: "Protocolos sincronizados." });
    } catch (e: unknown) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Erro ao guardar." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <PromoterSidebar eventId={event.id} />

      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "ESTÚDIO", href: `/promotor/events/${event.id}` },
              { label: "BRANDING", active: true },
            ]}
          />

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 mt-4">
            <div className="flex items-start gap-3">
              <Link
                href={`/promotor/events/${event.id}`}
                className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs uppercase tracking-wider"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                VOLTAR AO DASHBOARD
              </Link>
            </div>
            <button
              onClick={handleSynchronize}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#6C2BD9] hover:bg-[#5a24b8] text-white px-4 py-2.5 rounded-lg font-semibold text-xs uppercase transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {saving ? "A GUARDAR…" : "SINCRONIZAR PROTOCOLOS"}
            </button>
          </div>

          <div className="mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase">
              Protocolo <span className="text-[#a855f7]">Visual.</span>
            </h1>
            <p className="text-sm text-white/70 mt-1">
              Central de Branding e Configuração Técnica do Evento: <strong>{event.title}</strong>.
            </p>
          </div>

          {message && (
            <div
              className={`mb-4 px-4 py-2 rounded-lg text-sm ${
                message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-white/10 pb-2 mb-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                {tab.icon === "fingerprint" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-2.686 6-6 6s-6-2.483-6-6 2.686-6 6-6 6 2.483 6 6zm0 0c0 3.517 2.686 6 6 6s6-2.483 6-6-2.686-6-6-6-6 2.483-6 6z" />
                  </svg>
                )}
                {tab.icon === "desktop" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {tab.icon === "globe" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0h.5a2.5 2.5 0 002.5-2.5V3.935M12 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {tab.icon === "envelope" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
                {tab.icon === "device" && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "identidade" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor de Marca */}
              <div className="bg-zinc-900 border border-white/10 rounded-lg p-5">
                <h2 className="text-lg font-bold text-white uppercase mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#a855f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </span>
                  Editor de Marca
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs text-white/60 uppercase tracking-wider mb-2">TOM PRIMÁRIO</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-12 rounded-full border-2 border-white/20 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
                        placeholder="#6C2BD9"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 uppercase tracking-wider mb-2">TOM SECUNDÁRIO</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-12 rounded-full border-2 border-white/20 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
                        placeholder="#06B6D4"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 uppercase tracking-wider mb-2">LOGO DO EVENTO (URL)</label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://exemplo.com/logo.png"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/40"
                    />
                    {logoUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                        <img src={logoUrl} alt="Logo preview" className="w-full h-24 object-contain object-center bg-white/5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 uppercase tracking-wider mb-2">BANNER DO EVENTO (URL)</label>
                    <input
                      type="url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://exemplo.com/banner.jpg"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/40"
                    />
                    {bannerUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                        <img src={bannerUrl} alt="Banner preview" className="w-full h-32 object-cover object-center bg-white/5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 uppercase tracking-wider mb-2">FONTE PERSONALIZADA</label>
                    <input
                      type="text"
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      placeholder="Inter, Roboto, Arial..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/40"
                    />
                    <p className="text-xs text-white/50 mt-1">Nome da fonte (ex: "Inter", "Roboto", "Arial")</p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-zinc-900 border border-white/10 rounded-lg p-5">
                <h2 className="text-lg font-bold text-white uppercase mb-4">Pré-visualização da Marca</h2>
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="h-10 w-10 rounded bg-white/10 flex items-center justify-center text-white/50 text-xs">LOGO</div>
                      )}
                      <div>
                        <div className="text-white font-semibold" style={{ fontFamily: fontFamily || undefined }}>{event.title}</div>
                        <div className="text-white/60 text-xs">Evento</div>
                      </div>
                    </div>
                    {bannerUrl && (
                      <div className="rounded overflow-hidden mb-3">
                        <img src={bannerUrl} alt="Banner" className="w-full h-24 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <div className="h-8 flex-1 rounded" style={{ backgroundColor: primaryColor }} />
                      <div className="h-8 flex-1 rounded" style={{ backgroundColor: secondaryColor }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "landing" && (
            <div className="space-y-6">
              <div className="bg-zinc-900 border border-white/10 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#a855f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Editor de Landing Page
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomLandingPage}
                      onChange={(e) => setUseCustomLandingPage(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#6C2BD9] focus:ring-[#6C2BD9]"
                    />
                    <span className="text-sm text-white/70">Usar landing page customizada</span>
                  </label>
                </div>
                
                {useCustomLandingPage ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-white/60 uppercase tracking-wider mb-2">Conteúdo HTML da Landing Page</label>
                      <textarea
                        value={landingPageContent}
                        onChange={(e) => setLandingPageContent(e.target.value)}
                        placeholder="<div>...</div>"
                        rows={20}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/40 font-mono"
                      />
                      <p className="text-xs text-white/50 mt-1">HTML customizado para a landing page do evento. Use variáveis: {'{eventTitle}'}, {'{eventDescription}'}, {'{eventDate}'}, {'{venue}'}, {'{city}'}</p>
                    </div>
                    <div className="bg-zinc-800 rounded-lg p-4 border border-white/10">
                      <h3 className="text-sm font-semibold text-white mb-2">Preview</h3>
                      <div className="bg-white rounded p-4 min-h-[200px] text-black text-sm" dangerouslySetInnerHTML={{ __html: landingPageContent.replace(/\{eventTitle\}/g, event.title).replace(/\{eventDescription\}/g, "Descrição do evento").replace(/\{eventDate\}/g, new Date().toLocaleDateString("pt-PT")).replace(/\{venue\}/g, "Local").replace(/\{city\}/g, "Cidade") }} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/60">
                    <svg className="w-16 h-16 mx-auto mb-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">A landing page padrão será usada.</p>
                    <p className="text-xs mt-1">Ative "Usar landing page customizada" para criar uma landing page personalizada.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "dominios" && (
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-8 text-center">
              <h2 className="text-lg font-bold text-white uppercase mb-4">Gestão de Domínios.</h2>
              <div className="py-12 text-white/50">
                <p className="mb-2">Sem Domínios Personalizados</p>
                <p className="text-sm">Associe um domínio próprio (ex: bilhetes.meuevento.pt) para profissionalizar a experiência do utilizador.</p>
              </div>
              <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm uppercase hover:bg-blue-500/30">
                + NOVO DOMÍNIO
              </button>
            </div>
          )}

          {activeTab === "comunicacao" && (
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-8 text-center text-white/60">
              <h2 className="text-lg font-bold text-white uppercase mb-4">COMUNICAÇÃO</h2>
              <p>Configuração de templates de email e notificações em breve.</p>
            </div>
          )}

          {activeTab === "hardware" && (
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-8 text-center text-white/60">
              <h2 className="text-lg font-bold text-white uppercase mb-4">Dispositivos e Caixas</h2>
              <p>Gerir dispositivos POS, gateways e caixas registadoras em breve.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
