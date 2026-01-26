"use client";

import { signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FixSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFixSession = async () => {
    setLoading(true);
    try {
      // Force logout
      await signOut({ redirect: false });
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to login
      router.push("/auth/signin?callbackUrl=/admin");
    } catch (error) {
      console.error("Error fixing session:", error);
      // Fallback: redirect manually
      window.location.href = "/auth/signin?callbackUrl=/admin";
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
      <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl border border-zinc-700/50 p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Corrigir Sessão</h1>
        <p className="text-zinc-400 mb-6">
          A sua sessão atual tem um role antigo. Por favor, faça logout e login novamente para atualizar as permissões.
        </p>
        <button
          onClick={handleFixSession}
          disabled={loading}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "A processar..." : "Fazer Logout e Login Novamente"}
        </button>
      </div>
    </div>
  );
}

