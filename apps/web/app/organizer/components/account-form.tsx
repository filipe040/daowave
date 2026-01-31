"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Save } from "lucide-react";

interface AccountFormProps {
  organizerProfile: {
    id: string;
    brandName: string;
    status: string;
  };
  user: {
    name: string | null;
    email: string;
  };
}

export default function AccountForm({ organizerProfile, user }: AccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    brandName: organizerProfile.brandName,
    userName: user.name || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/promotor/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
          setErrors({ submit: data.error || "Erro ao guardar alterações" });
        }
        setLoading(false);
        return;
      }

      // Success
      setLoading(false);
      router.refresh();
    } catch (error) {
      console.error("Submit error:", error);
      setErrors({ submit: "Erro ao guardar alterações" });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {errors.submit && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            <span className="text-sm sm:text-base">{errors.submit}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
          Nome da Marca <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.brandName}
          onChange={(e) => handleChange("brandName", e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
          placeholder="Nome da sua marca/promotora"
          required
        />
        {errors.brandName && (
          <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} /> {errors.brandName}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm sm:text-base font-semibold mb-2 text-zinc-200">
          Nome de Utilizador
        </label>
        <input
          type="text"
          value={formData.userName}
          onChange={(e) => handleChange("userName", e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all hover:border-zinc-600"
          placeholder="Seu nome"
        />
        {errors.userName && (
          <p className="text-red-400 text-xs sm:text-sm mt-1.5 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.5} /> {errors.userName}
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin shrink-0" strokeWidth={1.5} />
              <span>A guardar...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5 shrink-0" strokeWidth={1.5} />
              <span>Guardar Alterações</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

