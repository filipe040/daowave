"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function NavClient() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/", redirect: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-zinc-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Left */}
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-pink-500 flex items-center justify-center bg-transparent">
              <span className="text-white font-bold text-sm md:text-base">LG</span>
            </div>
            <span className="text-white font-bold text-lg md:text-xl uppercase tracking-tight">
              5ive Tickets
            </span>
          </Link>
          
          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12 absolute left-1/2 transform -translate-x-1/2">
            <Link
              href="/events"
              className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
            >
              DISCOVER
            </Link>
            
            {session && (
              <Link
                href="/my-tickets"
                className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
              >
                MY TICKETS
              </Link>
            )}
            
            <Link
              href="/help"
              className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
            >
              HELP
            </Link>
          </nav>

          {/* Right Side - Login/User Menu */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-4">
                {/* User menu for desktop */}
                <div className="hidden md:flex items-center gap-4">
                  {session.user.role === "PROMOTER" && (
                    <Link
                      href="/promotor"
                      className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
                    >
                      PROMOTER
                    </Link>
                  )}
                  {session.user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
                    >
                      ADMIN
                    </Link>
                  )}
                  {/* User profile chip + logout */}
                  <div className="flex items-center gap-3">
                    <div className="bg-white text-black px-4 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wide max-w-xs truncate">
                      {session.user.name || session.user.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="bg-zinc-900 text-white font-bold text-sm uppercase tracking-wide px-4 py-2.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition-colors"
                    >
                      LOG OUT
                    </button>
                  </div>
                </div>
                
                {/* Mobile menu button when logged in */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-white p-2"
                  aria-label="Menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {mobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </div>
            ) : (
              <>
                {/* Login Button - Desktop */}
                <Link
                  href="/auth/signin"
                  className="hidden md:block bg-white text-black font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  LOG IN
                </Link>
                
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-white p-2"
                  aria-label="Menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {mobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-6 pt-4 border-t border-zinc-900 space-y-4">
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
            >
              DISCOVER
            </Link>
            
            {session ? (
              <>
                <Link
                  href="/my-tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                >
                  MY TICKETS
                </Link>
                
                {session.user.role === "PROMOTER" && (
                  <Link
                    href="/promotor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                  >
                    PROMOTER
                  </Link>
                )}
                
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                  >
                    ADMIN
                  </Link>
                )}
                
                <Link
                  href="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                >
                  HELP
                </Link>
                
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-white text-black font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors mt-4"
                >
                  LOG OUT
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                >
                  HELP
                </Link>
                
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block bg-white text-black font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors text-center mt-4"
                >
                  LOG IN
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
