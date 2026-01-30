"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";

function roleLabel(role: string) {
  if (role === "ADMIN") return "Admin";
  if (role === "PROMOTER") return "Promotor";
  if (role === "USER") return "Cliente";
  return role;
}

/** Converte URL de upload (/uploads/avatars/...) para URL servida pela API para a imagem carregar. */
function avatarDisplayUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/uploads/avatars/")) {
    return `/api/account/avatar/serve/${url.replace(/^\/uploads\/avatars\//, "")}`;
  }
  return url;
}

export default function NavClient() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{
    name: string | null;
    avatarUrl: string | null;
    role: string;
  } | null>(null);

  const displayName = profile?.name ?? session?.user?.name ?? session?.user?.email ?? "Conta";
  const displayRole = profile?.role ?? (session?.user as { role?: string })?.role ?? "USER";
  const avatarUrl = profile?.avatarUrl ?? null;

  const initials = useMemo(() => {
    const src = displayName === "Conta" ? session?.user?.email : displayName;
    return (
      (src || "")
        ?.split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U"
    );
  }, [displayName, session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    fetch("/api/account/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.user) return;
        setProfile({
          name: data.user.name ?? null,
          avatarUrl: data.user.avatarUrl ?? null,
          role: data.user.role ?? (session?.user as { role?: string })?.role ?? "USER",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel("daowave-session");
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== "session:update") return;
      setProfile((prev) => ({
        name: e.data.name !== undefined ? e.data.name : prev?.name ?? null,
        avatarUrl: e.data.avatarUrl !== undefined ? e.data.avatarUrl : prev?.avatarUrl ?? null,
        role: prev?.role ?? (session?.user as { role?: string })?.role ?? "USER",
      }));
    };
    bc.addEventListener("message", handler);
    return () => {
      bc.removeEventListener("message", handler);
      bc.close();
    };
  }, [session?.user?.role]);

  const userBlock = (
    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
      <Link
        href="/account"
        className="flex items-center gap-2 sm:gap-3 min-w-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <span
          className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center text-white text-xs font-semibold"
          aria-hidden
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarDisplayUrl(avatarUrl) ?? ""} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <div className="hidden sm:flex flex-col items-start min-w-0">
          <span className="text-white font-medium text-sm truncate max-w-[120px] md:max-w-[160px] leading-tight">
            {displayName}
          </span>
          <span className="text-white/60 text-xs font-normal truncate max-w-[120px] md:max-w-[160px] leading-tight">
            {roleLabel(displayRole)}
          </span>
        </div>
      </Link>
    </div>
  );

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
                {/* Desktop: avatar + name + role + links */}
                <div className="hidden md:flex items-center gap-4">
                  {userBlock}

                  {displayRole === "PROMOTER" && (
                    <Link
                      href="/promotor"
                      className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
                    >
                      PROMOTER
                    </Link>
                  )}
                  {displayRole === "ADMIN" && (
                    <Link
                      href="/promotor"
                      className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
                    >
                      DASHBOARD
                    </Link>
                  )}
                </div>

                {/* Mobile: avatar + name (compact) then menu button */}
                <div className="flex md:hidden items-center gap-2 min-w-0">
                  {userBlock}
                </div>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-white p-2 flex-shrink-0"
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
            {session && (
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-4"
              >
                <span className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center text-white text-sm font-semibold">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarDisplayUrl(avatarUrl) ?? ""} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium text-sm truncate">{displayName}</div>
                  <div className="text-white/60 text-xs">{roleLabel(displayRole)}</div>
                </div>
              </Link>
            )}

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
                    href="/promotor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                  >
                    DASHBOARD
                  </Link>
                )}

                <Link
                  href="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                >
                  HELP
                </Link>
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