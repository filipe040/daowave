"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PromoterSidebar from "../../../../components/promoter-sidebar";
import Breadcrumbs from "@/app/components/breadcrumbs";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  venue: string;
  city: string;
  startAt: Date | string;
  endAt: Date | string;
  coverImage: string | null;
  status: string;
  archivedAt: Date | string | null;
}

interface EventSettingsContentProps {
  event: Event;
}

export default function EventSettingsContent({ event: initialEvent }: EventSettingsContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    title: initialEvent.title,
    slug: initialEvent.slug,
    description: initialEvent.description,
    venue: initialEvent.venue,
    city: initialEvent.city,
    startAt: initialEvent.startAt instanceof Date 
      ? initialEvent.startAt.toISOString().slice(0, 16)
      : new Date(initialEvent.startAt).toISOString().slice(0, 16),
    endAt: initialEvent.endAt instanceof Date
      ? initialEvent.endAt.toISOString().slice(0, 16)
      : new Date(initialEvent.endAt).toISOString().slice(0, 16),
    coverImage: initialEvent.coverImage || "",
  });

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      const response = await fetch(`/api/promotor/events/${initialEvent.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          venue: formData.venue,
          city: formData.city,
          startAt: formData.startAt,
          endAt: formData.endAt,
          coverImage: formData.coverImage || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao guardar definições");
      }

      setToast({ type: "success", message: "Definições guardadas com sucesso!" });
      router.refresh();
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao guardar definições",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <PromoterSidebar eventId={initialEvent.id} />
      <main className="flex-1 overflow-y-auto lg:ml-56 xl:ml-64 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "ESTÚDIO", href: `/promotor/events/${initialEvent.id}` },
              { label: "DEFINIÇÕES", active: true },
            ]}
          />

          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase mb-2">
              Definições do Evento
            </h1>
            <p className="text-sm text-white/50">
              Gerir informações básicas do evento
            </p>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
                toast.type === "success"
                  ? "bg-green-500/20 border border-green-500/50 text-green-400"
                  : "bg-red-500/20 border border-red-500/50 text-red-400"
              }`}
            >
              {toast.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 lg:p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-xs sm:text-sm text-white/70 uppercase tracking-wider mb-2">
                Título do Evento
              </label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Nome do evento"
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-xs sm:text-sm text-white/70 uppercase tracking-wider mb-2">
                Slug (URL)
              </label>
              <input
                id="slug"
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors font-mono text-sm"
                placeholder="slug-do-evento"
              />
              <p className="text-xs text-white/50 mt-1.5">
                Usado na URL pública do evento
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs sm:text-sm text-white/70 uppercase tracking-wider mb-2">
                Descrição
              </label>
              <textarea
                id="description"
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
                placeholder="Descrição detalhada do evento..."
              />
            </div>

            {/* Venue & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="venue" className="block text-xs sm:text-sm text-white/70 uppercase tracking-wider mb-2">
                  Local
                </label>
                <input
                  id="venue"
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Nome do local"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-xs sm:text-sm text-white/70 uppercase tracking-wider mb-2">
                  Cidade
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Cidade"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startAt" className="block text-xs sm:text-sm text-white/70 uppercase tracking-wider mb-2">
                  Data/Hora Início
                </label>
                <input
                  id="startAt"
                  type="datetime-local"
                  required
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="endAt" className="block text-xs sm:text-sm text-white/70 uppercase tracking-wider mb-2">
                  Data/Hora Fim
                </label>
                <input
                  id="endAt"
                  type="datetime-local"
                  required
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                />
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <label htmlFor="coverImage" className="block text-xs sm:text-sm text-white/70 uppercase tracking-wider mb-2">
                Imagem de Capa (URL)
              </label>
              <input
                id="coverImage"
                type="url"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="https://exemplo.com/imagem.jpg"
              />
              {formData.coverImage && (
                <div className="mt-3">
                  <img
                    src={formData.coverImage}
                    alt="Preview"
                    className="max-w-xs rounded-lg border border-white/10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-white text-black rounded-lg font-semibold text-sm uppercase hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "A guardar..." : "Guardar Definições"}
              </button>
              <Link
                href={`/promotor/events/${initialEvent.id}`}
                className="px-6 py-2.5 bg-zinc-800 border border-white/10 text-white rounded-lg font-semibold text-sm uppercase hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
