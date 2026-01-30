"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Sparkles, ArrowRight } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = {
  title: string;
  slug: string;
  startAt: string;
  endAt: string;
};

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>({
    title: "",
    slug: "",
    startAt: "",
    endAt: "",
  });

  const canSubmit = useMemo(() => {
    if (!formData.title.trim()) return false;
    if (!formData.slug.trim()) return false;
    if (!formData.startAt) return false;
    if (!formData.endAt) return false;
    return true;
  }, [formData]);

  const reset = () =>
    setFormData({
      title: "",
      slug: "",
      startAt: "",
      endAt: "",
    });

  // ESC to close + lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        reset();
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleTitleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
      slug: slugify(value),
    }));
  };

  const handleSlugChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      slug: slugify(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !canSubmit) return;

    setLoading(true);

    try {
      const startAtISO = formData.startAt ? new Date(formData.startAt).toISOString() : "";
      const endAtISO = formData.endAt ? new Date(formData.endAt).toISOString() : "";

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || slugify(formData.title),
        startAt: startAtISO,
        endAt: endAtISO,
        description: formData.title.trim(),
        venue: "A definir",
        city: "A definir",
        coverImage: "",
      };

      const response = await fetch("/api/promotor/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        alert((data && (data.error || data.message)) || "Erro ao criar projeto");
        setLoading(false);
        return;
      }

      reset();
      onClose();
      router.push(`/promotor/events/${data.id}`);
      router.refresh();
    } catch (err) {
      console.error("Error creating project:", err);
      alert("Erro ao criar projeto");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      reset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8" onMouseDown={handleOverlayClick}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-3xl overflow-hidden rounded-3xl",
          "border border-border bg-card",
          "shadow-[0_22px_90px_rgba(0,0,0,.55)]"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Ambient glow (token-based) */}
        <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />

        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b border-border px-6 sm:px-8 py-5 sm:py-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="uppercase tracking-wider">Novo projeto</span>
            </div>

            <h2 className="mt-3 text-[18px] sm:text-[22px] font-semibold tracking-tight text-foreground">
              Criar experiência
            </h2>
            <p className="mt-1 text-[12px] sm:text-[13px] text-muted-foreground">
              Define o nome, slug e janela temporal. O resto afinas depois.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className={cn(
              "h-10 w-10 rounded-2xl border border-border",
              "bg-secondary hover:bg-secondary/80",
              "text-muted-foreground hover:text-foreground",
              "transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            aria-label="Fechar"
          >
            <X className="mx-auto h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 sm:py-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Nome do projeto
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Ex: DAO WAVE SUMMIT"
                required
                className={cn(
                  "w-full rounded-2xl border border-border bg-background",
                  "px-4 py-3.5 text-[14px] sm:text-[15px]",
                  "text-foreground placeholder:text-muted-foreground/70",
                  "outline-none transition-all duration-200",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              />
            </div>

            {/* Slug */}
            <div className="md:col-span-2">
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Slug
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="dao-wave-summit"
                  required
                  className={cn(
                    "flex-1 rounded-2xl border border-border bg-background",
                    "px-4 py-3.5 text-[14px] sm:text-[15px]",
                    "text-foreground placeholder:text-muted-foreground/70",
                    "outline-none transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                />

                <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-border bg-secondary px-3 py-3 text-[12px] text-muted-foreground">
                  <span className="text-muted-foreground/70">/</span>
                  <span className="font-medium text-foreground">{formData.slug || "slug"}</span>
                </div>
              </div>
            </div>

            {/* Start */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Início
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData((p) => ({ ...p, startAt: e.target.value }))}
                  required
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background",
                    "pl-10 pr-4 py-3.5 text-[13px] sm:text-[14px]",
                    "text-foreground",
                    "outline-none transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                />
              </div>
            </div>

            {/* End */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                Fim
              </label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData((p) => ({ ...p, endAt: e.target.value }))}
                  required
                  className={cn(
                    "w-full rounded-2xl border border-border bg-background",
                    "pl-10 pr-4 py-3.5 text-[13px] sm:text-[14px]",
                    "text-foreground",
                    "outline-none transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 border-t border-border pt-5">
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className={cn(
                "inline-flex w-full sm:flex-1 items-center justify-center gap-2 rounded-full",
                "bg-primary px-5 py-3.5",
                "text-[13px] font-semibold text-primary-foreground",
                "shadow-[0_18px_60px_rgba(0,0,0,.22)]",
                "transition-all duration-200",
                "hover:brightness-110",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              {loading ? "A criar…" : "Criar projeto"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className={cn(
                "inline-flex w-full sm:w-auto items-center justify-center rounded-full",
                "border border-border bg-secondary px-5 py-3.5",
                "text-[13px] font-semibold text-foreground",
                "hover:bg-secondary/80 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              Cancelar
            </button>
          </div>

          {/* Micro hint */}
          <div className="mt-4 text-[12px] text-muted-foreground">
            Dica: o slug é gerado automaticamente, mas podes ajustar.
          </div>
        </form>
      </div>
    </div>
  );
}