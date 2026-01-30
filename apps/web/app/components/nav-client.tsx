"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function NavClient() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/", redirect: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - Left */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-white font-bold text-lg md:text-xl uppercase tracking-tight">
              EasyTicket
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

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3 md:gap-4">
                {/* Desktop role links */}
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

                  {/* Simple account link (no avatar) */}
                  <Link
                    href="/account"
                    className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
                  >
                    CONTA
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    LOG OUT
                  </button>
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-white p-2"
                  aria-label="Menu"
                  type="button"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            ) : (
              <>
                {/* Desktop login */}
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
                  type="button"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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

                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                >
                  CONTA
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