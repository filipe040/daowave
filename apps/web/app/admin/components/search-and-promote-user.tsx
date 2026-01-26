"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchAndPromoteUser() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userFound, setUserFound] = useState<any>(null);

  const handleSearch = async () => {
    if (!email.trim()) {
      setError("Digite um email");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setUserFound(null);

    try {
      const res = await fetch(`/api/admin/users/search?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao procurar usuário");
        setLoading(false);
        return;
      }

      if (data.user) {
        setUserFound(data.user);
        if (data.user.role === "PROMOTER") {
          setError("Este usuário já é promotor");
        }
      } else {
        setError("Usuário não encontrado");
      }
    } catch (err) {
      setError("Erro ao procurar usuário");
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!userFound || !brandName.trim()) {
      setError("Nome da marca é obrigatório");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/users/${userFound.id}/promote-to-organizer`, {
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

      setSuccess(`Usuário ${userFound.email} promovido a promotor com sucesso!`);
      setUserFound(null);
      setEmail("");
      setBrandName("");
      router.refresh();
    } catch (err) {
      setError("Erro ao promover usuário");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              handleSearch();
            }
          }}
          placeholder="email@exemplo.com"
          className="flex-1 rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          disabled={loading}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !email.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "A procurar..." : "Procurar"}
        </button>
      </div>

      {userFound && userFound.role !== "PROMOTER" && (
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
          <div className="mb-3">
            <p className="text-sm text-zinc-400">Usuário encontrado:</p>
            <p className="font-semibold">{userFound.email}</p>
            <p className="text-sm text-zinc-400">Nome: {userFound.name || "N/A"}</p>
            <p className="text-sm text-zinc-400">Role atual: {userFound.role}</p>
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Nome da marca do promotor"
              className="w-full rounded-xl border border-zinc-700/50 bg-zinc-900/50 px-4 py-3 text-white transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              disabled={loading}
            />
            <button
              onClick={handlePromote}
              disabled={loading || !brandName.trim()}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "A promover..." : "Promover a Promotor"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-green-400 text-sm">
          {success}
        </div>
      )}
    </div>
  );
}

