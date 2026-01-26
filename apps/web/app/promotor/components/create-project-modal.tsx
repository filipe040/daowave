"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    startAt: "",
    endAt: "",
  });

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setFormData({
      ...formData,
      title: value,
      slug: value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert datetime-local to ISO string
      const startAtISO = formData.startAt ? new Date(formData.startAt).toISOString() : "";
      const endAtISO = formData.endAt ? new Date(formData.endAt).toISOString() : "";

      const response = await fetch("/api/promotor/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug || formData.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
          startAt: startAtISO,
          endAt: endAtISO,
          description: formData.title, // Use title as description for now
          venue: "A definir",
          city: "A definir",
          coverImage: "",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao criar projeto");
        setLoading(false);
        return;
      }

      const data = await response.json();
      // Reset form
      setFormData({
        title: "",
        slug: "",
        startAt: "",
        endAt: "",
      });
      onClose();
      router.push(`/promotor/events/${data.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Erro ao criar projeto");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setFormData({
        title: "",
        slug: "",
        startAt: "",
        endAt: "",
      });
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4 py-8"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-black border border-white/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 px-6 sm:px-8 py-4 sm:py-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white uppercase mb-2">
              NOVAS COORDEADAS.
            </h2>
            <p className="text-xs sm:text-sm text-white/70 uppercase tracking-wide">
              INSTANCIAR NOVO AMBIENTE DE TRABALHO
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 border border-white/30 flex items-center justify-center hover:border-white transition-colors"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
            {/* Left Column */}
            <div className="space-y-6 sm:space-y-8">
              {/* Project Identification */}
              <div>
                <label className="block text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-2 sm:mb-3">
                  IDENTIFICAÇÃO DO PROJETO
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="NOME DO EVENTO"
                  required
                  className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/50 px-0 py-3 sm:py-4 focus:outline-none focus:border-white transition-colors text-base sm:text-lg md:text-xl font-bold uppercase"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-2 sm:mb-3">
                  DATA INÍCIO
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.startAt}
                    onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/50 px-0 py-3 sm:py-4 focus:outline-none focus:border-white transition-colors text-sm sm:text-base pr-8 sm:pr-10"
                  />
                  <div className="absolute right-0 top-0 bottom-0 flex items-center text-white/50 pointer-events-none pr-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6 sm:space-y-8">
              {/* Slug */}
              <div>
                <label className="block text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-2 sm:mb-3">
                  FREQUÊNCIA ÚNICA (SLUG)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, ""),
                    })
                  }
                  placeholder="slug-do-evento"
                  required
                  className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/50 px-0 py-3 sm:py-4 focus:outline-none focus:border-white transition-colors text-base sm:text-lg md:text-xl font-bold text-white/70 uppercase"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs sm:text-sm text-white/50 uppercase tracking-wider mb-2 sm:mb-3">
                  DATA FIM
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.endAt}
                    onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-white/30 text-white placeholder-white/50 px-0 py-3 sm:py-4 focus:outline-none focus:border-white transition-colors text-sm sm:text-base pr-8 sm:pr-10"
                  />
                  <div className="absolute right-0 top-0 bottom-0 flex items-center text-white/50 pointer-events-none pr-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-6 sm:pt-8 border-t border-white/10">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-white text-black px-6 py-4 sm:py-5 rounded-lg font-bold text-sm sm:text-base uppercase tracking-wide hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "A LANÇAR..." : "LANÇAR EXPERIÊNCIA"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  title: "",
                  slug: "",
                  startAt: "",
                  endAt: "",
                });
                onClose();
              }}
              className="flex-1 sm:flex-none sm:w-auto bg-black border-2 border-white text-white px-6 py-4 sm:py-5 rounded-lg font-bold text-sm sm:text-base uppercase tracking-wide hover:bg-white/10 transition-colors"
            >
              ABORTAR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
