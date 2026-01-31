"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  FileText,
  MapPin,
  Ticket,
  Users,
  FileCheck,
  Accessibility,
  Phone,
  Image,
  Info,
  AlertTriangle,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";

interface OrganizerOption {
  id: string;
  brandName: string;
  user: { name: string | null; email: string };
}

interface EventFormProps {
  eventId?: string;
  initialData?: any;
  /** Quando true, mostra seletor de promotor e envia para API admin (criar evento como admin) */
  isAdminCreate?: boolean;
  availableOrganizers?: OrganizerOption[];
  defaultPromoterId?: string;
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

const tabs: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "basic", label: "Informações Básicas", icon: FileText },
  { id: "location", label: "Local e Datas", icon: MapPin },
  { id: "checkin", label: "Check-in e Entradas", icon: Ticket },
  { id: "capacity", label: "Bilhética e Capacidade", icon: Users },
  { id: "policies", label: "Políticas e Legal", icon: FileCheck },
  { id: "accessibility", label: "Acessibilidade", icon: Accessibility },
  { id: "contact", label: "Contactos e Suporte", icon: Phone },
  { id: "media", label: "Media", icon: Image },
];

export default function EventForm({ eventId, initialData, isAdminCreate, availableOrganizers = [], defaultPromoterId }: EventFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [promoterId, setPromoterId] = useState(defaultPromoterId ?? "");

  // Form state
  const [formData, setFormData] = useState({
    // Basic
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    status: initialData?.status || "DRAFT",
    
    // Location
    city: initialData?.city || "",
    venueName: initialData?.venueName || (initialData as { venue?: string })?.venue || "",
    address: initialData?.address || "",
    startAt: initialData?.startAt ? format(new Date(initialData.startAt), "yyyy-MM-dd'T'HH:mm") : "",
    endAt: initialData?.endAt ? format(new Date(initialData.endAt), "yyyy-MM-dd'T'HH:mm") : "",
    timezone: initialData?.timezone || "Europe/Lisbon",
    
    // Check-in
    checkinMode: initialData?.checkinMode || "SINGLE",
    reentryAllowed: initialData?.reentryAllowed || false,
    maxEntries: initialData?.maxEntries || null,
    entryWindowStartAt: initialData?.entryWindowStartAt ? format(new Date(initialData.entryWindowStartAt), "yyyy-MM-dd'T'HH:mm") : "",
    entryWindowEndAt: initialData?.entryWindowEndAt ? format(new Date(initialData.entryWindowEndAt), "yyyy-MM-dd'T'HH:mm") : "",
    
    // Capacity
    capacityTotal: initialData?.capacityTotal || null,
    
    // Policies
    ageRestriction: initialData?.ageRestriction || null,
    refundPolicy: initialData?.refundPolicy || "",
    cancellationPolicy: initialData?.cancellationPolicy || "",
    termsText: initialData?.termsText || "",
    consentRGPD: initialData?.consentRGPD || false,
    
    // Accessibility
    wheelchairAccess: initialData?.wheelchairAccess || false,
    signLanguageSupport: initialData?.signLanguageSupport || false,
    accessibleWC: initialData?.accessibleWC || false,
    accessibilityNotes: initialData?.accessibilityNotes || "",
    
    // Contact
    contactEmail: initialData?.contactEmail || "",
    contactPhone: initialData?.contactPhone || "",
    supportInstructions: initialData?.supportInstructions || "",
    
    // Media
    bannerUrl: initialData?.bannerUrl || "",
    galleryUrls: initialData?.galleryUrls || [],
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
    } else if (initialData && formData.slug === initialData.slug) {
      // If using template, generate new slug to avoid conflicts
      const baseSlug = formData.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const newSlug = `${baseSlug}-${Date.now().toString().slice(-6)}`;
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }
  }, [formData.title, formData.slug, initialData]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateTab = (tabId: string): boolean => {
    const newErrors: Record<string, string> = {};

    if (tabId === "basic") {
      if (!formData.title.trim()) newErrors.title = "Título é obrigatório";
      if (!formData.slug.trim()) newErrors.slug = "Slug é obrigatório";
      if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        newErrors.slug = "Slug inválido (apenas letras minúsculas, números e hífens)";
      }
      if (!formData.description.trim()) newErrors.description = "Descrição é obrigatória";
    }

    if (tabId === "location") {
      if (!formData.city.trim()) newErrors.city = "Cidade é obrigatória";
      if (!formData.venueName.trim()) newErrors.venueName = "Nome do local é obrigatório";
      if (!formData.address.trim()) newErrors.address = "Endereço é obrigatório";
      if (!formData.startAt) newErrors.startAt = "Data de início é obrigatória";
      if (!formData.endAt) newErrors.endAt = "Data de fim é obrigatória";
      
      if (formData.startAt && formData.endAt) {
        const start = new Date(formData.startAt);
        const end = new Date(formData.endAt);
        if (end <= start) {
          newErrors.endAt = "Data de fim deve ser posterior à data de início";
        }
      }
    }

    if (tabId === "checkin") {
      if (formData.checkinMode === "MULTI" && !formData.maxEntries) {
        newErrors.maxEntries = "maxEntries é obrigatório para modo MULTI";
      }
      if (!formData.reentryAllowed && formData.checkinMode === "MULTI") {
        newErrors.checkinMode = "Modo MULTI requer reentryAllowed=true";
      }
    }

    if (tabId === "contact") {
      if (!formData.contactEmail.trim()) {
        newErrors.contactEmail = "Email de contacto é obrigatório";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
        newErrors.contactEmail = "Email inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    setLoading(true);
    setErrors({});
    setPublishErrors([]);

    // Validate all tabs
    let isValid = true;
    for (const tab of tabs) {
      if (!validateTab(tab.id)) {
        isValid = false;
      }
    }

    if (isAdminCreate && !promoterId?.trim()) {
      setErrors((prev) => ({ ...prev, promoterId: "Selecione o promotor responsável" }));
      setLoading(false);
      return;
    }

    if (!isValid) {
      setLoading(false);
      // Go to first tab with errors
      const firstErrorTab = tabs.find((tab) => {
        const tabFields: Record<string, string[]> = {
          basic: ["title", "slug", "description"],
          location: ["city", "venueName", "address", "startAt", "endAt"],
          checkin: ["maxEntries", "checkinMode"],
          contact: ["contactEmail"],
        };
        return tabFields[tab.id as keyof typeof tabFields]?.some((field) => errors[field]);
      });
      if (firstErrorTab) setActiveTab(firstErrorTab.id);
      return;
    }

    try {
      // Convert datetime-local ("yyyy-MM-ddTHH:mm") or any parseable date to ISO 8601
      const convertToISO = (dateTimeLocal: string): string | null => {
        if (!dateTimeLocal || typeof dateTimeLocal !== "string") return null;
        const trimmed = dateTimeLocal.trim();
        if (!trimmed) return null;
        const date = new Date(trimmed);
        if (Number.isNaN(date.getTime())) return null;
        try {
          return date.toISOString();
        } catch {
          return null;
        }
      };

      const payload: any = {
        ...formData,
        startAt: convertToISO(formData.startAt ?? "") ?? (formData.startAt ? null : undefined),
        endAt: convertToISO(formData.endAt ?? "") ?? (formData.endAt ? null : undefined),
        entryWindowStartAt: formData.entryWindowStartAt ? convertToISO(formData.entryWindowStartAt) : null,
        entryWindowEndAt: formData.entryWindowEndAt ? convertToISO(formData.entryWindowEndAt) : null,
        maxEntries: formData.maxEntries ? parseInt(formData.maxEntries as any) : null,
        capacityTotal: formData.capacityTotal ? parseInt(formData.capacityTotal as any) : null,
        ageRestriction: formData.ageRestriction ? parseInt(formData.ageRestriction as any) : null,
        galleryUrls: Array.isArray(formData.galleryUrls) ? formData.galleryUrls : [],
      };

      const url = isAdminCreate ? "/api/admin/events" : eventId ? `/api/promotor/events/${eventId}` : "/api/promotor/events";
      const method = isAdminCreate ? "POST" : eventId ? "PUT" : "POST";
      const body = isAdminCreate ? { ...payload, promoterId } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          // Zod validation errors
          const zodErrors: Record<string, string> = {};
          data.details.forEach((err: any) => {
            zodErrors[err.path[0]] = err.message;
          });
          setErrors(zodErrors);
        } else {
          setErrors({ submit: data.error || "Erro ao guardar evento" });
        }
        setLoading(false);
        return;
      }

      // Success
      setLoading(false);
      setErrors({});
      
      if (isAdminCreate) {
        router.push("/admin/events");
        router.refresh();
        return;
      }
      if (!eventId) {
        // New event - redirect to events list first, then to edit page
        router.push(`/promotor/events`);
        setTimeout(() => {
          window.location.href = `/promotor/events/${data.id}/edit`;
        }, 100);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Submit error:", error);
      setErrors({ submit: "Erro ao guardar evento" });
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!eventId) {
      setPublishErrors(["Deve guardar o evento antes de publicar"]);
      return;
    }

    setLoading(true);
    setPublishErrors([]);

    const convertToISO = (dateTimeLocal: string): string | null => {
      if (!dateTimeLocal || typeof dateTimeLocal !== "string") return null;
      const date = new Date(dateTimeLocal.trim());
      if (Number.isNaN(date.getTime())) return null;
      try {
        return date.toISOString();
      } catch {
        return null;
      }
    };

    try {
      // Save current form data first so publish validates the same dates/times the user sees
      const payload: any = {
        ...formData,
        startAt: convertToISO(formData.startAt ?? "") ?? null,
        endAt: convertToISO(formData.endAt ?? "") ?? null,
        entryWindowStartAt: formData.entryWindowStartAt ? convertToISO(formData.entryWindowStartAt) : null,
        entryWindowEndAt: formData.entryWindowEndAt ? convertToISO(formData.entryWindowEndAt) : null,
        maxEntries: formData.maxEntries ? parseInt(formData.maxEntries as any) : null,
        capacityTotal: formData.capacityTotal ? parseInt(formData.capacityTotal as any) : null,
        ageRestriction: formData.ageRestriction ? parseInt(formData.ageRestriction as any) : null,
        galleryUrls: Array.isArray(formData.galleryUrls) ? formData.galleryUrls : [],
      };

      const saveRes = await fetch(`/api/organizer/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!saveRes.ok) {
        const saveData = await saveRes.json();
        if (saveData.details) {
          const messages = Array.isArray(saveData.details)
            ? saveData.details.map((e: { message?: string; path?: string[] } | string) => typeof e === "string" ? e : (e as { message?: string }).message ?? "")
            : [];
          setPublishErrors(messages.length ? messages : [saveData.error || "Erro ao guardar. Corrija os dados e tente publicar novamente."]);
        } else {
          setPublishErrors([saveData.error || "Erro ao guardar. Corrija os dados e tente publicar novamente."]);
        }
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/promotor/events/${eventId}/publish`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const messages = Array.isArray(data.details)
            ? data.details.map((e: { field?: string; message?: string } | string) => typeof e === "string" ? e : (e as { message?: string }).message ?? "")
            : [];
          setPublishErrors(messages.length ? messages : [data.error || "Erro ao publicar evento"]);
        } else {
          // If it's a 403 error about needing approval, show friendly message
          if (res.status === 403 && data.error?.includes("aprovação")) {
            setPublishErrors([
              "O seu evento foi enviado para aprovação de um administrador.",
              "Será notificado quando o evento for aprovado e publicado."
            ]);
          } else {
            setPublishErrors([data.error || "Erro ao publicar evento"]);
          }
        }
        setLoading(false);
        return;
      }

      // Success
      router.push("/promotor/events");
      router.refresh();
    } catch (error) {
      console.error("Publish error:", error);
      setPublishErrors(["Erro ao publicar evento"]);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Promotor responsável (apenas quando admin cria evento) */}
      {isAdminCreate && availableOrganizers.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 backdrop-blur-sm">
          <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
            Promotor responsável <span className="text-red-400">*</span>
          </label>
          <select
            value={promoterId}
            onChange={(e) => {
              setPromoterId(e.target.value);
              setErrors((prev) => ({ ...prev, promoterId: "" }));
            }}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
          >
            <option value="">Selecione um promotor</option>
            {availableOrganizers.map((org) => (
              <option key={org.id} value={org.id}>
                {org.brandName} ({org.user.email})
              </option>
            ))}
          </select>
          {errors.promoterId && (
            <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.promoterId}
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-800 overflow-x-auto -mx-6 px-6">
        <div className="flex gap-1 sm:gap-2 min-w-max pb-1">
          {tabs.map((tab) => {
            const hasError = Object.keys(errors).some((key) => {
              const tabFields: Record<string, string[]> = {
                basic: ["title", "slug", "description"],
                location: ["city", "venueName", "address", "startAt", "endAt"],
                checkin: ["maxEntries", "checkinMode"],
                contact: ["contactEmail"],
              };
              return tabFields[tab.id as keyof typeof tabFields]?.includes(key);
            });

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  // Allow free navigation between tabs
                  // Validation only happens on submit
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 border-b-2 transition-all whitespace-nowrap text-xs sm:text-sm font-medium ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400 bg-blue-500/10"
                    : hasError
                    ? "border-red-500/50 text-red-400 hover:border-red-500"
                    : "border-transparent text-zinc-400 hover:text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {(() => {
                  const Icon = tab.icon;
                  return <Icon className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" strokeWidth={1.5} />;
                })()}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                {hasError && <span className="text-red-500 text-xs">●</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6 backdrop-blur-sm shadow-lg shadow-black/20">
        {/* Tab 1: Basic Info */}
        {activeTab === "basic" && (
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                Título do Evento <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="Ex: Festival de Verão 2024"
              />
              {errors.title && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.title}
              </p>}
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                Slug (URL) <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-sm whitespace-nowrap">/events/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleChange("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                  placeholder="festival-verao-2024"
                />
              </div>
              {errors.slug && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.slug}
              </p>}
              <p className="text-zinc-500 text-xs mt-1.5">
                URL completa: <code className="bg-zinc-800/50 px-1.5 py-0.5 rounded text-zinc-300">/events/{formData.slug || "..."}</code>
              </p>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600 cursor-pointer"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                Descrição <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600 resize-y min-h-[120px]"
                placeholder="Descreva o evento em detalhe..."
              />
              {errors.description && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.description}
              </p>}
            </div>
          </div>
        )}

        {/* Tab 2: Location & Dates */}
        {activeTab === "location" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                  Cidade <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                  placeholder="Lisboa"
                />
                {errors.city && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.city}
                </p>}
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                  Nome do Local <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={(e) => handleChange("venueName", e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                  placeholder="Pavilhão Atlântico"
                />
                {errors.venueName && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.venueName}
                </p>}
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                Endereço Completo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="Rua Exemplo 123, 1000-000 Lisboa"
              />
                {errors.address && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.address}
                </p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                  Data e Hora de Início <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => handleChange("startAt", e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                />
                {errors.startAt && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.startAt}
                </p>}
              </div>

              <div>
                <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                  Data e Hora de Fim <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => handleChange("endAt", e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                />
                {errors.endAt && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.endAt}
                </p>}
              </div>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
              >
                <option value="Europe/Lisbon">Europe/Lisbon (WET/WEST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 3: Check-in */}
        {activeTab === "checkin" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 sm:p-6 backdrop-blur-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reentryAllowed}
                  onChange={(e) => {
                    const reentry = e.target.checked;
                    handleChange("reentryAllowed", reentry);
                    if (!reentry) {
                      handleChange("checkinMode", "SINGLE");
                      handleChange("maxEntries", null);
                    }
                  }}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <div>
                  <div className="font-medium">Permitir sair e entrar do evento</div>
                  <div className="text-sm text-zinc-500">
                    Se desativado, cada bilhete permite apenas uma entrada (modo SINGLE)
                  </div>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                Modo de Check-in <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.checkinMode}
                onChange={(e) => {
                  const mode = e.target.value as "SINGLE" | "MULTI";
                  handleChange("checkinMode", mode);
                  if (mode === "SINGLE") {
                    handleChange("maxEntries", null);
                  }
                }}
                disabled={!formData.reentryAllowed}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-700"
              >
                <option value="SINGLE">SINGLE - Uma entrada total</option>
                <option value="MULTI" disabled={!formData.reentryAllowed}>
                  MULTI - Múltiplas entradas (requer reentryAllowed)
                </option>
              </select>
              {errors.checkinMode && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} /> {errors.checkinMode}
              </p>}
              {!formData.reentryAllowed && (
                <p className="text-zinc-500 text-xs sm:text-sm mt-1.5 flex items-center gap-1.5">
                  <Info className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  <span>Ative "Permitir sair e entrar" para usar modo MULTI</span>
                </p>
              )}
            </div>

            {formData.checkinMode === "MULTI" && (
              <div>
                <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                  Máximo de Entradas <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="2"
                  value={formData.maxEntries || ""}
                  onChange={(e) => handleChange("maxEntries", e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                  placeholder="Ex: 5"
                />
                {errors.maxEntries && <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 shrink-0" /> {errors.maxEntries}
                </p>}
                <p className="text-zinc-500 text-xs sm:text-sm mt-1.5">
                  Número máximo de vezes que o mesmo bilhete pode entrar no evento
                </p>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              <h3 className="font-semibold text-sm sm:text-base text-zinc-200">Janela de Validação (Opcional)</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Início da Janela</label>
                  <input
                    type="datetime-local"
                    value={formData.entryWindowStartAt}
                    onChange={(e) => handleChange("entryWindowStartAt", e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Fim da Janela</label>
                  <input
                    type="datetime-local"
                    value={formData.entryWindowEndAt}
                    onChange={(e) => handleChange("entryWindowEndAt", e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                  />
                </div>
              </div>
              <p className="text-zinc-500 text-xs">
                Define uma janela de tempo durante a qual os bilhetes podem ser validados
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Capacity */}
        {activeTab === "capacity" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Capacidade Total (Opcional)</label>
              <input
                type="number"
                min="1"
                value={formData.capacityTotal || ""}
                onChange={(e) => handleChange("capacityTotal", e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="Ex: 1000"
              />
              <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                A capacidade não pode ser inferior ao total de bilhetes vendidos
              </p>
            </div>
          </div>
        )}

        {/* Tab 5: Policies */}
        {activeTab === "policies" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Restrição de Idade</label>
              <input
                type="number"
                min="0"
                value={formData.ageRestriction || ""}
                onChange={(e) => handleChange("ageRestriction", e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="Ex: 18"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Política de Reembolso</label>
              <textarea
                value={formData.refundPolicy}
                onChange={(e) => handleChange("refundPolicy", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="Descreva a política de reembolso..."
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Política de Cancelamento</label>
              <textarea
                value={formData.cancellationPolicy}
                onChange={(e) => handleChange("cancellationPolicy", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="Descreva a política de cancelamento..."
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Termos e Condições</label>
              <textarea
                value={formData.termsText}
                onChange={(e) => handleChange("termsText", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="Termos e condições do evento..."
              />
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consentRGPD}
                  onChange={(e) => handleChange("consentRGPD", e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <div>
                  <div className="font-medium">
                    Consentimento RGPD <span className="text-red-400">*</span>
                  </div>
                  <div className="text-sm text-zinc-500">
                    Obrigatório para publicar o evento
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Tab 6: Accessibility */}
        {activeTab === "accessibility" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.wheelchairAccess}
                  onChange={(e) => handleChange("wheelchairAccess", e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="font-medium">Acesso para cadeiras de rodas</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.signLanguageSupport}
                  onChange={(e) => handleChange("signLanguageSupport", e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="font-medium">Suporte de Língua Gestual</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.accessibleWC}
                  onChange={(e) => handleChange("accessibleWC", e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="font-medium">WC Acessível</span>
              </label>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Notas de Acessibilidade</label>
              <textarea
                value={formData.accessibilityNotes}
                onChange={(e) => handleChange("accessibilityNotes", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="Informações adicionais sobre acessibilidade..."
              />
            </div>
          </div>
        )}

        {/* Tab 7: Contact */}
        {activeTab === "contact" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                Email de Contacto <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="contacto@exemplo.pt"
              />
              {errors.contactEmail && <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>}
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Telefone de Contacto</label>
              <input
                type="tel"
                value={formData.contactPhone || ""}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="+351 912 345 678"
              />
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">Instruções de Suporte</label>
              <textarea
                value={formData.supportInstructions}
                onChange={(e) => handleChange("supportInstructions", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="Instruções para contacto de suporte..."
              />
            </div>
          </div>
        )}

        {/* Tab 8: Media */}
        {activeTab === "media" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
                URL da Imagem de Banner <span className="text-red-400">*</span> (para publicar)
              </label>
              <input
                type="text"
                value={formData.bannerUrl}
                onChange={(e) => {
                  let value = e.target.value.trim();
                  // Auto-add https:// if imgur.com link doesn't have protocol
                  if (value.includes("imgur.com") && !value.startsWith("http")) {
                    // Convert imgur.com/xxx to https://i.imgur.com/xxx.jpg for direct image links
                    if (value.includes("/a/") || value.match(/imgur\.com\/[a-zA-Z0-9]+$/)) {
                      // Gallery or post link, keep as is but add https://
                      value = `https://${value}`;
                    } else if (value.includes("i.imgur.com")) {
                      value = `https://${value}`;
                    } else {
                      // Try to convert to direct image link
                      const match = value.match(/imgur\.com\/([a-zA-Z0-9]+)/);
                      if (match) {
                        value = `https://i.imgur.com/${match[1]}.jpg`;
                      } else {
                        value = `https://${value}`;
                      }
                    }
                  }
                  handleChange("bannerUrl", value);
                }}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="https://i.imgur.com/xxx.jpg ou imgur.com/xxx"
              />
              {formData.bannerUrl && (
                <div className="mt-4">
                  <img
                    src={formData.bannerUrl.startsWith("http") ? formData.bannerUrl : `https://${formData.bannerUrl}`}
                    alt="Banner preview"
                    className="rounded-lg max-w-md max-h-48 object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                      // Try alternative imgur formats
                      const currentSrc = img.src;
                      if (currentSrc.includes("imgur.com") && !currentSrc.includes("i.imgur.com")) {
                        const match = currentSrc.match(/imgur\.com\/([a-zA-Z0-9]+)/);
                        if (match) {
                          img.src = `https://i.imgur.com/${match[1]}.jpg`;
                          img.style.display = "block";
                        }
                      }
                    }}
                  />
                </div>
              )}
              <p className="text-zinc-500 text-xs mt-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                Banner é obrigatório para publicar o evento
              </p>
              <p className="text-zinc-400 text-xs mt-1 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                Suporta links do Imgur: pode colar links como <code className="bg-zinc-800 px-1 rounded">imgur.com/xxx</code> ou <code className="bg-zinc-800 px-1 rounded">i.imgur.com/xxx.jpg</code>
              </p>
            </div>

            <div>
              <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">URLs da Galeria (uma por linha)</label>
              <textarea
                value={Array.isArray(formData.galleryUrls) ? formData.galleryUrls.join("\n") : formData.galleryUrls || ""}
                onChange={(e) => {
                  const urls = e.target.value
                    .split("\n")
                    .map((url) => url.trim())
                    .filter((url) => url.length > 0);
                  handleChange("galleryUrls", urls);
                }}
                rows={6}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
                placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Errors */}
      {errors.submit && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">
          {errors.submit}
        </div>
      )}

      {publishErrors.length > 0 && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <div className="font-medium text-red-400 mb-2">Erros ao publicar:</div>
          <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
            {publishErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-3 text-sm font-semibold transition-all hover:bg-zinc-700"
        >
          Cancelar
        </button>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? isAdminCreate
                ? "A criar..."
                : "A guardar..."
              : isAdminCreate
                ? "Criar e Publicar Evento"
                : eventId
                  ? "Guardar Alterações"
                  : "Criar Evento"}
          </button>

          {eventId && !isAdminCreate && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading || formData.status === "PUBLISHED"}
              className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "A publicar..." : formData.status === "PUBLISHED" ? "Já Publicado" : "Publicar Evento"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

