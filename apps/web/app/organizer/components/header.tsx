"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface OrganizerHeaderProps {
  organizerName: string;
  userEmail: string;
  onMenuClick?: () => void;
}

export default function OrganizerHeader({ organizerName, userEmail, onMenuClick }: OrganizerHeaderProps) {
  return (
    <header className="border-b border-neutral-200 bg-neutral-1000 backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3 min-w-0">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              className="md:hidden flex-shrink-0 p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
              aria-label="Abrir menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-neutral-900 truncate">{organizerName}</h1>
            <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <Link
            href="/events"
            target="_blank"
            className="text-xs sm:text-sm text-neutral-500 hover:text-neutral-900 transition-colors whitespace-nowrap"
          >
            Ver Portal
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
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

