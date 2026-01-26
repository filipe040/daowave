"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface AdminEventFormProps {
  defaultOrganizerId?: string;
  availableOrganizers: Array<{
    id: string;
    brandName: string;
    user: {
      name: string | null;
      email: string;
    };
  }>;
}

const categories = [
  "Concertos",
  "Desporto",
  "Nightlife",
  "Teatro",
  "Festivais",
  "Conferências",
  "Workshops",
  "Outros",
];

const tabs = [
  { id: "basic", label: "Informações Básicas", icon: "📝" },
  { id: "location", label: "Local e Datas", icon: "📍" },
  { id: "checkin", label: "Check-in e Entradas", icon: "🎫" },
  { id: "capacity", label: "Bilhética e Capacidade", icon: "👥" },
  { id: "policies", label: "Políticas e Legal", icon: "📋" },
  { id: "accessibility", label: "Acessibilidade", icon: "♿" },
  { id: "contact", label: "Contactos e Suporte", icon: "📞" },
  { id: "media", label: "Media", icon: "🖼️" },
];

export default function AdminEventForm({ defaultOrganizerId, availableOrganizers }: AdminEventFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    promoterId: defaultOrganizerId || "",
    title: "",
    slug: "",
    description: "",
    category: "",
    
    city: "",
    venueName: "",
    address: "",
    startAt: "",
    endAt: "",
    timezone: "Europe/Lisbon",
    
    checkinMode: "SINGLE" as "SINGLE" | "MULTI",
    reentryAllowed: false,
    maxEntries: null as number | null,
    entryWindowStartAt: "",
    entryWindowEndAt: "",
    
    capacityTotal: null as number | null,
    
    ageRestriction: null as number | null,
    refundPolicy: "",
    cancellationPolicy: "",
    termsText: "",
    consentRGPD: false,
    
    wheelchairAccess: false,
    signLanguageSupport: false,
    accessibleWC: false,
    accessibilityNotes: "",
    
    contactEmail: "",
    contactPhone: "",
    supportInstructions: "",
    
    bannerUrl: "",
    galleryUrls: [] as string[],
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Convert datetime-local format to ISO 8601
    const convertToISO = (dateTimeLocal: string): string | null => {
      if (!dateTimeLocal) return null;
      const date = new Date(dateTimeLocal);
      return date.toISOString();
    };

    const payload: any = {
      ...formData,
      startAt: formData.startAt ? convertToISO(formData.startAt) : null,
      endAt: formData.endAt ? convertToISO(formData.endAt) : null,
      entryWindowStartAt: formData.entryWindowStartAt ? convertToISO(formData.entryWindowStartAt) : null,
      entryWindowEndAt: formData.entryWindowEndAt ? convertToISO(formData.entryWindowEndAt) : null,
      maxEntries: formData.maxEntries ? parseInt(String(formData.maxEntries)) : null,
      capacityTotal: formData.capacityTotal ? parseInt(String(formData.capacityTotal)) : null,
      ageRestriction: formData.ageRestriction ? parseInt(String(formData.ageRestriction)) : null,
      galleryUrls: Array.isArray(formData.galleryUrls) ? formData.galleryUrls : [],
    };

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const zodErrors: Record<string, string> = {};
          data.details.forEach((err: any) => {
            zodErrors[err.path[0]] = err.message;
          });
          setErrors(zodErrors);
        } else {
          setErrors({ submit: data.error || "Erro ao criar evento" });
        }
        setLoading(false);
        return;
      }

      // Success - redirect to events list
      router.push("/admin/events");
      router.refresh();
    } catch (error) {
      console.error("Submit error:", error);
      setErrors({ submit: "Erro ao criar evento" });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Organizer Selection */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-6">
        <h2 className="text-xl font-semibold mb-4">Promotor Responsável</h2>
        <select
          value={formData.promoterId}
          onChange={(e) => setFormData((prev) => ({ ...prev, promoterId: e.target.value }))}
          required
          className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        >
          <option value="">Selecione um promotor</option>
          {availableOrganizers.map((org) => (
            <option key={org.id} value={org.id}>
              {org.brandName} ({org.user.email})
            </option>
          ))}
        </select>
        {errors.promoterId && (
          <p className="mt-2 text-sm text-red-400">{errors.promoterId}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 overflow-hidden">
        <div className="border-b border-zinc-700/50 px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-purple-400 border-b-2 border-purple-400"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Basic Info */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  required
                  pattern="^[a-z0-9-]+$"
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <p className="mt-1 text-xs text-zinc-400">Apenas letras minúsculas, números e hífens</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                  rows={6}
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Location */}
          {activeTab === "location" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cidade *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Local *</label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, venueName: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Endereço *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Data/Hora de Início *</label>
                  <input
                    type="datetime-local"
                    value={formData.startAt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startAt: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data/Hora de Fim *</label>
                  <input
                    type="datetime-local"
                    value={formData.endAt}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endAt: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Check-in */}
          {activeTab === "checkin" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Modo de Check-in *</label>
                <select
                  value={formData.checkinMode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, checkinMode: e.target.value as "SINGLE" | "MULTI" }))}
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="SINGLE">Único (SINGLE)</option>
                  <option value="MULTI">Múltiplo (MULTI)</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reentryAllowed"
                  checked={formData.reentryAllowed}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reentryAllowed: e.target.checked }))}
                  className="rounded border-zinc-700 bg-zinc-900"
                />
                <label htmlFor="reentryAllowed" className="text-sm">Permitir reentrada</label>
              </div>
              {formData.checkinMode === "MULTI" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Máximo de Entradas</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxEntries || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxEntries: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              )}
            </div>
          )}

          {/* Other tabs - simplified for now */}
          {activeTab === "capacity" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Capacidade Total</label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacityTotal || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, capacityTotal: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
          )}

          {activeTab === "policies" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Idade Mínima</label>
                <input
                  type="number"
                  min="0"
                  value={formData.ageRestriction || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ageRestriction: e.target.value ? parseInt(e.target.value) : null }))}
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Política de Reembolso</label>
                <textarea
                  value={formData.refundPolicy}
                  onChange={(e) => setFormData((prev) => ({ ...prev, refundPolicy: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
          )}

          {activeTab === "accessibility" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wheelchairAccess"
                  checked={formData.wheelchairAccess}
                  onChange={(e) => setFormData((prev) => ({ ...prev, wheelchairAccess: e.target.checked }))}
                  className="rounded border-zinc-700 bg-zinc-900"
                />
                <label htmlFor="wheelchairAccess" className="text-sm">Acesso para cadeiras de rodas</label>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email de Contacto *</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefone de Contacto</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">URL do Banner</label>
                <input
                  type="url"
                  value={formData.bannerUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bannerUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {errors.submit && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-400">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-xl border border-zinc-700/50 bg-zinc-800/50 text-white hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "A criar..." : "Criar e Publicar Evento"}
        </button>
      </div>
    </form>
  );
}

