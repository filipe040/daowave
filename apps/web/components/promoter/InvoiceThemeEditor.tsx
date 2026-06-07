"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Save, Eye, RotateCcw, Palette, Image as ImageIcon } from "lucide-react";
import type { InvoiceThemeJson } from "@/lib/invoice/invoice-theme";

const inputCls =
  "public-input px-5 py-3 text-sm";
const labelCls = "public-label mb-2";

type Scope = "organization" | "event";

interface InvoiceThemeEditorProps {
  scope: Scope;
  eventId?: string;
  eventTitle?: string;
  backHref?: string;
  backLabel?: string;
}

const EMPTY_THEME: InvoiceThemeJson = {};

export function InvoiceThemeEditor({
  scope,
  eventId,
  eventTitle,
}: InvoiceThemeEditorProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<InvoiceThemeJson>(EMPTY_THEME);
  const [useOverride, setUseOverride] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (scope === "organization") {
        const res = await fetch("/api/promotor/invoice-theme");
        if (!res.ok) throw new Error("Erro ao carregar tema");
        const data = await res.json();
        setOrgName(data.organization?.name || "");
        setTheme((data.invoiceThemeJson as InvoiceThemeJson) || {});
        setUseOverride(!!data.invoiceThemeJson);
      } else if (eventId) {
        const [eventRes, orgRes] = await Promise.all([
          fetch(`/api/promotor/events/${eventId}`),
          fetch("/api/promotor/invoice-theme"),
        ]);
        if (!eventRes.ok) throw new Error("Erro ao carregar evento");
        const event = await eventRes.json();
        const orgData = orgRes.ok ? await orgRes.json() : null;
        setOrgName(orgData?.organization?.name || "");
        setTheme((event.invoiceThemeJson as InvoiceThemeJson) || {});
        setUseOverride(!!event.invoiceThemeJson);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [scope, eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshPreview = useCallback(
    async (currentTheme: InvoiceThemeJson, override: boolean) => {
      setPreviewLoading(true);
      try {
        const res = await fetch("/api/promotor/invoice-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scope,
            eventId: scope === "event" ? eventId : undefined,
            invoiceThemeJson: override ? currentTheme : null,
            format: "html",
          }),
        });
        if (res.ok) {
          setPreviewHtml(await res.text());
        }
      } catch {
        /* preview opcional */
      } finally {
        setPreviewLoading(false);
      }
    },
    [scope, eventId]
  );

  useEffect(() => {
    if (loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      refreshPreview(theme, scope === "organization" ? true : useOverride);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [theme, useOverride, loading, refreshPreview, scope]);

  const updateField = <K extends keyof InvoiceThemeJson>(
    key: K,
    value: InvoiceThemeJson[K]
  ) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (scope === "organization") {
        const res = await fetch("/api/promotor/invoice-theme", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invoiceThemeJson: theme }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Erro ao guardar");
        }
      } else if (eventId) {
        const res = await fetch(`/api/promotor/events/${eventId}/branding`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceThemeJson: useOverride ? theme : null,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Erro ao guardar");
        }
      }
      toast.success("Design de faturas guardado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (scope === "event") {
      setUseOverride(false);
      setTheme({});
      return;
    }
    setTheme({});
  };

  if (loading) {
    return (
      <div className="grid lg:grid-cols-2 gap-8 animate-pulse">
        <div className="h-96 rounded-3xl bg-neutral-50" />
        <div className="h-[600px] rounded-3xl bg-neutral-50" />
      </div>
    );
  }

  const formDisabled = scope === "event" && !useOverride;

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        {scope === "event" && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useOverride}
                onChange={(e) => setUseOverride(e.target.checked)}
                className="mt-1 rounded border-neutral-300"
              />
              <div>
                <div className="text-sm font-bold text-neutral-900">
                  Personalizar faturas deste evento
                </div>
                <div className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  {eventTitle ? (
                    <>
                      Por defeito, <strong className="text-neutral-600">{eventTitle}</strong> usa o
                      design da organização ({orgName || "organização"}). Ative para definir um
                      design específico.
                    </>
                  ) : (
                    "Por defeito herda o design da organização. Ative para override."
                  )}
                </div>
              </div>
            </label>
          </div>
        )}

        <div
          className={`rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5 ${
            formDisabled ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <div className="flex items-center gap-2 text-violet-600">
            <Palette className="h-4 w-4" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Identidade</h3>
          </div>

          <div>
            <label className={labelCls}>Nome na fatura</label>
            <input
              className={inputCls}
              value={theme.brandName || ""}
              onChange={(e) => updateField("brandName", e.target.value || undefined)}
              placeholder={orgName || "Nome da marca"}
            />
          </div>

          <div>
            <label className={labelCls}>Tagline</label>
            <input
              className={inputCls}
              value={theme.tagline || ""}
              onChange={(e) => updateField("tagline", e.target.value || undefined)}
              placeholder="Bilhética Digital"
            />
          </div>

          <div>
            <label className={labelCls}>
              <ImageIcon className="inline h-3.5 w-3.5 mr-1" />
              URL do logo
            </label>
            <input
              className={inputCls}
              value={theme.logoUrl || ""}
              onChange={(e) => updateField("logoUrl", e.target.value || undefined)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Cor primária</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.primaryColor || "#6C2BD9"}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="h-11 w-14 rounded-xl border border-neutral-200 bg-transparent cursor-pointer"
                />
                <input
                  className={inputCls}
                  value={theme.primaryColor || ""}
                  onChange={(e) => updateField("primaryColor", e.target.value || undefined)}
                  placeholder="#6C2BD9"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Cor secundária</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.secondaryColor || "#D946EF"}
                  onChange={(e) => updateField("secondaryColor", e.target.value)}
                  className="h-11 w-14 rounded-xl border border-neutral-200 bg-transparent cursor-pointer"
                />
                <input
                  className={inputCls}
                  value={theme.secondaryColor || ""}
                  onChange={(e) => updateField("secondaryColor", e.target.value || undefined)}
                  placeholder="#D946EF"
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Website (rodapé)</label>
            <input
              className={inputCls}
              value={theme.websiteUrl || ""}
              onChange={(e) => updateField("websiteUrl", e.target.value || undefined)}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className={labelCls}>Texto personalizado (rodapé)</label>
            <textarea
              className={`${inputCls} min-h-[72px] resize-y`}
              value={theme.footerText || ""}
              onChange={(e) => updateField("footerText", e.target.value || undefined)}
              placeholder="Informação adicional legal ou de contacto"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={theme.showPlatformCredit !== false}
              onChange={(e) => updateField("showPlatformCredit", e.target.checked)}
              className="rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-600">
              Mostrar crédito LivePass no rodapé
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving || formDisabled}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-gray-100 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "A guardar..." : "Guardar"}
          </button>
          <button
            onClick={handleReset}
            disabled={formDisabled}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            {scope === "event" ? "Usar design da org." : "Limpar"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 overflow-hidden flex flex-col min-h-[640px]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2 text-neutral-600 text-sm font-bold">
            <Eye className="h-4 w-4" />
            Pré-visualização
          </div>
          {previewLoading && (
            <span className="text-xs text-neutral-500 animate-pulse">A atualizar...</span>
          )}
        </div>
        <div className="flex-1 bg-neutral-50 overflow-auto">
          {previewHtml ? (
            <iframe
              srcDoc={previewHtml}
              title="Pré-visualização da fatura"
              className="w-full h-full min-h-[600px] border-0"
              sandbox="allow-same-origin"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500 text-sm">
              A gerar preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
