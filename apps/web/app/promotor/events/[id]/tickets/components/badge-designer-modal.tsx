"use client";

import { useState, useRef } from "react";

interface BadgeDesignerModalProps {
  eventId: string;
  eventTitle: string;
  currentDesign?: {
    templateImageUrl: string | null;
    prefix: string | null;
  };
  onClose: () => void;
}

export default function BadgeDesignerModal({
  eventId,
  eventTitle,
  currentDesign,
  onClose,
}: BadgeDesignerModalProps) {
  const [templateImageUrl, setTemplateImageUrl] = useState(currentDesign?.templateImageUrl || "");
  const [prefix, setPrefix] = useState(currentDesign?.prefix || "BADGE");
  const [quantity, setQuantity] = useState(10);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentDesign?.templateImageUrl || null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Por favor, selecione um ficheiro de imagem");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setTemplateImageUrl(""); // Clear URL input when file is selected
    }
  };

  const handleLoadDesign = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/promotor/events/${eventId}/badge-design`);
      if (!res.ok) {
        throw new Error("Erro ao carregar design");
      }
      const data = await res.json();
      if (data.templateImageUrl) {
        setTemplateImageUrl(data.templateImageUrl);
        setPreviewUrl(data.templateImageUrl);
      }
      if (data.prefix) {
        setPrefix(data.prefix);
      }
      setSuccess("Design carregado com sucesso");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar design");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let imageUrl = templateImageUrl;

      // If file is selected, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("eventId", eventId);

        const uploadRes = await fetch(`/api/promotor/events/${eventId}/badge-design/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          throw new Error(uploadData.error || "Erro ao fazer upload da imagem");
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      if (!imageUrl && !selectedFile) {
        throw new Error("Por favor, forneça uma imagem template ou URL");
      }

      const res = await fetch(`/api/promotor/events/${eventId}/badge-design`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateImageUrl: imageUrl || null,
          prefix: prefix.trim() || "BADGE",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao guardar design");
      }

      setSuccess("Design guardado com sucesso");
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao guardar design");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBadges = async () => {
    if (!templateImageUrl && !previewUrl) {
      setError("Por favor, forneça uma imagem template primeiro");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/promotor/events/${eventId}/badge-design/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          prefix: prefix.trim() || "BADGE",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao gerar badges");
      }

      setSuccess(`${quantity} badges gerados com sucesso`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao gerar badges");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white uppercase">BADGE DESIGNER</h2>
            <p className="text-sm text-white/60 mt-1">AMBIENTE DE CONFIGURAÇÃO FÍSICA</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Evento <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={eventTitle}
                disabled
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 disabled:opacity-50"
              />
              <button
                onClick={handleLoadDesign}
                disabled={loading}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Carregar Design
              </button>
              <button
                onClick={handleSaveDesign}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar Design
              </button>
            </div>
          </div>

          {/* Template Image Upload */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Imagem do Badge Template
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-colors"
                >
                  Escolher ficheiro
                </button>
                <span className="text-sm text-white/60">
                  {selectedFile ? selectedFile.name : "Nenhum ficheiro selecionado"}
                </span>
              </div>
              <div className="text-sm text-white/60">ou</div>
              <input
                type="url"
                value={templateImageUrl}
                onChange={(e) => {
                  setTemplateImageUrl(e.target.value);
                  if (e.target.value) {
                    setPreviewUrl(e.target.value);
                    setSelectedFile(null);
                  }
                }}
                placeholder="URL da imagem template..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40"
              />
              {previewUrl && (
                <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                  <img
                    src={previewUrl}
                    alt="Template preview"
                    className="w-full h-48 object-contain bg-white/5"
                    onError={() => {
                      setPreviewUrl(null);
                      setError("Erro ao carregar imagem");
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Prefix */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Prefixo</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40"
              placeholder="BADGE"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Quantidade</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40"
            />
          </div>

          {/* Generate Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleGenerateBadges}
              disabled={saving || (!templateImageUrl && !previewUrl)}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Gerar Badges
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
