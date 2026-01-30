"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import PromoterSidebar from "../../../../components/promoter-sidebar";
import Breadcrumbs from "@/app/components/breadcrumbs";

interface Event {
  id: string;
  title: string;
  slug: string;
}

interface Asset {
  id: string;
  filename: string;
  name?: string | null;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date | string;
}

interface AssetsContentProps {
  event: Event;
  initialAssets: Asset[];
}

export default function AssetsContent({ event, initialAssets }: AssetsContentProps) {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", message: "Apenas imagens são permitidas (PNG, JPG, WEBP)" });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: "error", message: "Ficheiro muito grande (máximo 10MB)" });
      return;
    }

    setUploading(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/promotor/events/${event.id}/assets/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer upload");
      }

      setAssets([data.asset, ...assets]);
      setToast({ type: "success", message: "Asset carregado com sucesso!" });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao fazer upload",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este asset?")) {
      return;
    }

    try {
      const response = await fetch(`/api/promotor/events/${event.id}/assets/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao eliminar asset");
      }

      setAssets(assets.filter((a) => a.id !== assetId));
      setToast({ type: "success", message: "Asset eliminado com sucesso!" });
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao eliminar asset",
      });
    }
  };

  if (toast) {
    setTimeout(() => setToast(null), 5000);
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <PromoterSidebar eventId={event.id} />
      <main className="flex-1 overflow-y-auto lg:ml-72 pt-12 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: "ESTÚDIO", href: `/promotor/events/${event.id}` },
              { label: "BIBLIOTECA ASSETS", active: true },
            ]}
          />

          {/* Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white uppercase mb-2">
              Biblioteca de Assets
            </h1>
            <p className="text-sm text-white/50">
              Gerir imagens e media do evento {event.title}
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

          {/* Upload Section */}
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 sm:p-5 lg:p-6">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`px-6 py-2.5 bg-white text-black rounded-lg font-semibold text-sm uppercase cursor-pointer hover:bg-zinc-100 transition-colors ${
                  uploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {uploading ? "A carregar..." : "+ Carregar Asset"}
              </label>
              <p className="text-xs text-white/50">
                PNG, JPG, WEBP até 10MB
              </p>
            </div>
          </div>

          {/* Assets Grid */}
          {assets.length === 0 ? (
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-12 md:p-16 lg:p-20 text-center">
              <div className="mb-6 flex justify-center">
              <ImageIcon className="h-16 w-16 text-white/40" strokeWidth={1.5} />
            </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3">Nenhum asset carregado</h3>
              <p className="text-base md:text-lg text-white/50 mb-8 max-w-md mx-auto">
                Carregue imagens para usar no branding e landing page do evento
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all group"
                >
                  <div className="aspect-square relative bg-zinc-800">
                    <img
                      src={asset.url}
                      alt={asset.name ?? asset.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          '<div class="w-full h-full flex items-center justify-center text-white/30 text-xs">Erro ao carregar</div>';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded text-xs uppercase font-semibold transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-white/70 truncate mb-1" title={asset.name ?? asset.filename}>
                      {asset.name ?? asset.filename}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-white/50">
                      <span>{formatFileSize(asset.size)}</span>
                      <span>
                        {new Date(asset.createdAt).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
