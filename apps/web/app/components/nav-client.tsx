"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

const ROLE_LABELS: Record<string, string> = {
  USER: "Utilizador",
  PROMOTER: "Promotor",
  ADMIN: "Admin",
};

function getInitials(name: string | null | undefined, email: string | undefined): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

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
  const [localName, setLocalName] = useState<string | undefined>(undefined);
  const [localAvatar, setLocalAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const res = await fetch("/api/account/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const u = data.user;
        setLocalName(u?.name ?? undefined);
        setLocalAvatar(u?.avatarUrl ?? undefined);
      } catch {
        // ignore
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    try {
      const bc = new BroadcastChannel("daowave-session");
      bc.onmessage = (ev: MessageEvent<{ type?: string; name?: string | null; avatarUrl?: string | null }>) => {
        const msg = ev.data;
        if (msg?.type === "session:update") {
          if (msg.name !== undefined) setLocalName(msg.name ?? undefined);
          if (msg.avatarUrl !== undefined) setLocalAvatar(msg.avatarUrl ?? undefined);
        }
      };
      return () => bc.close();
    } catch {
      // ignore
    }
  }, []);

  const displayName = localName ?? session?.user?.name ?? session?.user?.email ?? "";
  const avatarUrl = localAvatar ?? (session?.user as { avatarUrl?: string })?.avatarUrl ?? (session?.user as { image?: string })?.image;
  const role = (session?.user as { role?: string })?.role ?? "USER";
  const roleLabel = ROLE_LABELS[role] ?? role;
  const initials = getInitials(localName ?? session?.user?.name ?? null, session?.user?.email ?? undefined);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/", redirect: true });
  };

  const UserBlock = ({ compact = false, onClick }: { compact?: boolean; onClick?: () => void }) => (
    <Link
      href="/account"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 sm:px-3 sm:py-2 transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black ${compact ? "w-full" : ""}`}
    >
      <div className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-full overflow-hidden border border-white/10 bg-white/10 flex items-center justify-center">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarDisplayUrl(avatarUrl) ?? ""} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-white/90">{initials}</span>
        )}
      </div>
      <div className="min-w-0 text-left">
        <p className="truncate text-sm font-semibold text-white/90 max-w-[120px] sm:max-w-[140px]">
          {displayName || "Conta"}
        </p>
        <p className="text-[10px] sm:text-xs uppercase tracking-wider text-white/50">
          {roleLabel}
        </p>
      </div>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-white font-bold text-lg md:text-xl uppercase tracking-tight">
              EasyTicket
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-12 absolute left-1/2 transform -translate-x-1/2">
            <Link
              href="/events"
              className="text-white font-medium text-sm xl:text-base uppercase tracking-wide hover:opacity-70 transition-opacity"
            >
              DESCOBRIR
            </Link>
            {session && (
              <Link
                href="/my-tickets"
                className="text-white font-medium text-sm xl:text-base uppercase tracking-wide hover:opacity-70 transition-opacity"
              >
                MEUS BILHETES
              </Link>
            )}
            <Link
              href="/help"
              className="text-white font-medium text-sm xl:text-base uppercase tracking-wide hover:opacity-70 transition-opacity"
            >
              AJUDA
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="hidden lg:flex items-center gap-3 xl:gap-4">
                  {role === "PROMOTER" && (
                    <Link
                      href="/organizer"
                      className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
                    >
                      PROMOTOR
                    </Link>
                  )}
                  {role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="text-white font-medium text-sm uppercase tracking-wide hover:opacity-70 transition-opacity"
                    >
                      ADMIN
                    </Link>
                  )}
                  <UserBlock />
                  <button
                    onClick={handleSignOut}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-all hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                  >
                    SAIR
                  </button>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden text-white p-2"
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
                <Link
                  href="/auth/signin"
                  className="hidden lg:block bg-white text-black font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors"
                >
                  ENTRAR
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden text-white p-2"
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

        {mobileMenuOpen && (
          <nav className="lg:hidden pb-6 pt-4 border-t border-white/10 space-y-4">
            {session && (
              <div className="pb-4 border-b border-white/10">
                <UserBlock compact onClick={() => setMobileMenuOpen(false)} />
              </div>
            )}
            <Link
              href="/events"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
            >
              DESCOBRIR
            </Link>
            {session ? (
              <>
                <Link
                  href="/my-tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                >
                  MEUS BILHETES
                </Link>
                {role === "PROMOTER" && (
                  <Link
                    href="/organizer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                  >
                    PROMOTOR
                  </Link>
                )}
                {role === "ADMIN" && (
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
                  AJUDA
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-white text-black font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors mt-4"
                >
                  SAIR
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/help"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white font-medium text-sm uppercase tracking-wide py-2 hover:opacity-70 transition-opacity"
                >
                  AJUDA
                </Link>
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block bg-white text-black font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors text-center mt-4"
                >
                  ENTRAR
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
