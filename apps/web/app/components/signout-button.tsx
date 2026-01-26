"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      // Try to sign out
      try {
        await signOut({ 
          callbackUrl: "/",
          redirect: false 
        });
      } catch (signOutError) {
        console.log("SignOut error (ignoring):", signOutError);
      }
      
      // Clear all cookies manually
      if (typeof document !== "undefined") {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      // Clear sessionStorage and localStorage
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        localStorage.clear();
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force redirect
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Sign out error:", error);
      // Fallback: clear everything and redirect
      if (typeof window !== "undefined") {
        if (typeof document !== "undefined") {
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm transition-all hover:border-zinc-600 hover:bg-zinc-800 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "A sair..." : "Sair"}
    </button>
  );
}

