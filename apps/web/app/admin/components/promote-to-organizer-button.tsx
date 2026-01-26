"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PromoteToOrganizerButtonProps {
  userId: string;
  userEmail: string;
}

export function PromoteToOrganizerButton({ userId, userEmail }: PromoteToOrganizerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [brandName, setBrandName] = useState("");

  const handlePromote = async () => {
    if (!brandName.trim()) {
      setError("Nome da marca é obrigatório");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}/promote-to-organizer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: brandName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao promover usuário");
        setLoading(false);
        return;
      }

      // Success - refresh page
      router.refresh();
    } catch (err) {
      setError("Erro ao promover usuário");
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Nome da marca"
          className="px-3 py-1 rounded-lg border border-zinc-700/50 bg-zinc-900/50 text-white text-sm"
          disabled={loading}
        />
        <div className="flex gap-2">
          <button
            onClick={handlePromote}
            disabled={loading}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "A promover..." : "Promover"}
          </button>
          <button
            onClick={() => {
              setShowForm(false);
              setBrandName("");
              setError(null);
            }}
            disabled={loading}
            className="px-3 py-1 rounded-lg border border-zinc-700/50 bg-zinc-800/50 text-white text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold transition-all"
    >
      Promover a Promotor
    </button>
  );
}

