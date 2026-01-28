"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AccountUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
}

interface AccountProfileProps {
  user: AccountUser;
}

export default function AccountProfile({ user }: AccountProfileProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setToast(null);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar nome");
      }

      setToast({ type: "success", message: "Nome atualizado com sucesso." });
      router.refresh();
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Erro ao atualizar nome",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", message: "Apenas imagens são permitidas." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", message: "Ficheiro demasiado grande (máx. 5MB)." });
      return;
    }

    setUploading(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar foto de perfil");
      }

      setAvatarUrl(data.avatarUrl ?? null);
      setToast({ type: "success", message: "Foto de perfil atualizada." });
      router.refresh();
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Erro ao atualizar foto de perfil",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const initials =
    (user.name || user.email)
      ?.split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Toast */}
        {toast && (
          <div
            className={`mb-4 rounded-md px-4 py-3 text-sm ${
              toast.type === "success"
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {toast.message}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 mb-6">
          Conta e perfil
        </h1>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-6">
          {/* Avatar + info básica */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-800 border border-slate-300"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs text-white">
                    ...
                  </div>
                )}
              </button>
              <div>
                <p className="text-sm text-slate-500">Foto de perfil</p>
                <p className="text-xs text-slate-500">
                  Imagem quadrada recomendada, até 5MB (JPG, PNG, WEBP)
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Nome + email + role */}
          <form onSubmit={handleNameSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                  Nome de utilizador
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="O teu nome"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-1.5">
                  Perfil
                </label>
                <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  {user.role}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={savingName}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingName ? "A guardar..." : "Guardar alterações"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

