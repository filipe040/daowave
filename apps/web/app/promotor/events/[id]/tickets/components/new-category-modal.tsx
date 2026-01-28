"use client";

import { useState } from "react";

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

export default function NewCategoryModal({ isOpen, onClose, eventId }: NewCategoryModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    assetClass: "GERAL",
    nominalValue: "0",
    publicIssuance: true,
    transferableAsset: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/promotor/events/${eventId}/ticket-lots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          nominalValue: formData.nominalValue,
          assetClass: formData.assetClass,
          publicIssuance: formData.publicIssuance,
          transferableAsset: formData.transferableAsset,
          quantity: 100, // Default quantity
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao criar categoria");
      }

      // Reset form and close modal
      setFormData({
        title: "",
        assetClass: "GERAL",
        nominalValue: "0",
        publicIssuance: true,
        transferableAsset: true,
      });
      
      onClose();
      // Reload page to show new category
      window.location.reload();
    } catch (error) {
      console.error("Error creating category:", error);
      alert(error instanceof Error ? error.message : "Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4 py-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-zinc-900 border border-white/20 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-0.5">
              <span className="text-white">NOVA </span>
              <span className="text-green-400">CATEGORIA</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/70">
              DEFINIÇÃO DE PARÂMETROS OPERATIVOS
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* IDENTIFICAÇÃO DO TÍTULO */}
          <div>
            <label htmlFor="title" className="block text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1.5">
              IDENTIFICAÇÃO DO TÍTULO
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="EX: PASSE FULL EXPERIENCE / VIP LOUNGE"
              className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 transition-colors text-xs sm:text-sm uppercase"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* CLASSE DE ATIVO e VALOR NOMINAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CLASSE DE ATIVO */}
            <div>
              <label htmlFor="assetClass" className="block text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1.5">
                CLASSE DE ATIVO
              </label>
              <div className="relative">
                <select
                  id="assetClass"
                  className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-white focus:outline-none focus:border-green-500/50 transition-colors text-xs sm:text-sm font-bold appearance-none cursor-pointer pr-8"
                  value={formData.assetClass}
                  onChange={(e) => setFormData({ ...formData, assetClass: e.target.value })}
                >
                  <option value="GERAL" className="bg-zinc-800">GERAL</option>
                  <option value="VIP" className="bg-zinc-800">VIP</option>
                  <option value="PREMIUM" className="bg-zinc-800">PREMIUM</option>
                  <option value="STANDARD" className="bg-zinc-800">STANDARD</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* VALOR NOMINAL */}
            <div>
              <label htmlFor="nominalValue" className="block text-[10px] sm:text-xs text-white/50 uppercase tracking-wider mb-1.5">
                VALOR NOMINAL (€)
              </label>
              <input
                id="nominalValue"
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-white focus:outline-none focus:border-green-500/50 transition-colors text-xs sm:text-sm"
                value={formData.nominalValue}
                onChange={(e) => setFormData({ ...formData, nominalValue: e.target.value })}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4">
            {/* EMISSÃO PÚBLICA */}
            <div className="flex items-center justify-between">
              <label htmlFor="publicIssuance" className="text-xs sm:text-sm text-white uppercase tracking-wider">
                EMISSÃO PÚBLICA
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, publicIssuance: !formData.publicIssuance })}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  formData.publicIssuance ? "bg-green-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.publicIssuance ? "translate-x-5" : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>

            {/* ATIVO TRANSFERÍVEL */}
            <div className="flex items-center justify-between">
              <label htmlFor="transferableAsset" className="text-xs sm:text-sm text-white uppercase tracking-wider">
                ATIVO TRANSFERÍVEL
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transferableAsset: !formData.transferableAsset })}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  formData.transferableAsset ? "bg-green-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.transferableAsset ? "translate-x-5" : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-white/70 transition-colors text-xs sm:text-sm uppercase tracking-wider"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "A INSTANCIAR..." : "INSTANCIAR CATEGORIA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
