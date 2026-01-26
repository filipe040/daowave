"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface OrganizerHeaderProps {
  organizerName: string;
  userEmail: string;
}

export default function OrganizerHeader({ organizerName, userEmail }: OrganizerHeaderProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-white">{organizerName}</h1>
          <p className="text-xs text-zinc-500">{userEmail}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/events"
            target="_blank"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Ver Portal Público
          </Link>
          <button
            onClick={async () => {
              try {
                await signOut({ 
                  callbackUrl: "/",
                  redirect: false 
                });
                // Manual redirect after signOut completes
                window.location.href = "/";
              } catch (error) {
                console.error("Sign out error:", error);
                // Fallback: redirect manually even on error
                window.location.href = "/";
              }
            }}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

