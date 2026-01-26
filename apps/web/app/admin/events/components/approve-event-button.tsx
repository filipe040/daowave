"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ApproveEventButtonProps {
  eventId: string;
}

export function ApproveEventButton({ eventId }: ApproveEventButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!confirm("Tem certeza que deseja aprovar e publicar este evento?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/events/${eventId}/approve`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao aprovar evento");
        setLoading(false);
        return;
      }

      // Success - refresh page
      router.refresh();
    } catch (err) {
      setError("Erro ao aprovar evento");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleApprove}
        disabled={loading}
        className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "A aprovar..." : "Aprovar e Publicar"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

