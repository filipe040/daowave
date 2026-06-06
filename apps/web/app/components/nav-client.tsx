"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Ticket } from "lucide-react";

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
      className={`flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-2 py-1.5 sm:px-3 sm:py-2 transition-all hover:border-violet-200 hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${compact ? "w-full" : ""}`}
    >
      <div className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 rounded-full overflow-hidden border border-violet-100 bg-violet-50 flex items-center justify-center">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarDisplayUrl(avatarUrl) ?? ""} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs font-bold text-violet-700">{initials}</span>
        )}
      </div>
      <div className="min-w-0 text-left">
        <p className="truncate text-sm font-semibold text-neutral-900 max-w-[120px] sm:max-w-[140px]">
          {displayName || "Conta"}
        </p>
        <p className="text-[10px] sm:text-xs uppercase tracking-wider text-neutral-500">
          {roleLabel}
        </p>
      </div>
    </Link>
  );

  const navLinkCls = "text-neutral-600 font-semibold text-sm uppercase tracking-wide hover:text-violet-600 transition-colors";

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-[72px]">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-md shadow-violet-500/25">
              <Ticket className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-neutral-900 font-black text-lg md:text-xl tracking-tight">
              GoPass
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 xl:gap-10 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/events" className={navLinkCls}>
              Descobrir
            </Link>
            {session && (
              <Link href="/my-tickets" className={navLinkCls}>
                Meus bilhetes
              </Link>
            )}
            <Link href="/help" className={navLinkCls}>
              Ajuda
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="hidden lg:flex items-center gap-3 xl:gap-4">
                  {role === "PROMOTER" && (
                    <Link href="/organizer" className={navLinkCls}>
                      Promotor
                    </Link>
                  )}
                  {role === "ADMIN" && (
                    <Link href="/admin" className={navLinkCls}>
                      Admin
                    </Link>
                  )}
                  <UserBlock />
                  <button
                    onClick={handleSignOut}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-neutral-700 transition-all hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                  >
                    Sair
                  </button>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden text-neutral-700 p-2 rounded-lg hover:bg-neutral-100"
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
                  className="hidden lg:inline-flex bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-xl hover:opacity-95 transition-all shadow-md shadow-violet-500/25"
                >
                  Entrar
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden text-neutral-700 p-2 rounded-lg hover:bg-neutral-100"
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
          <nav className="lg:hidden pb-6 pt-4 border-t border-neutral-200 space-y-3">
            {session && (
              <div className="pb-4 border-b border-neutral-200">
                <UserBlock compact onClick={() => setMobileMenuOpen(false)} />
              </div>
            )}
            <Link href="/events" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navLinkCls}`}>
              Descobrir
            </Link>
            {session ? (
              <>
                <Link href="/my-tickets" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navLinkCls}`}>
                  Meus bilhetes
                </Link>
                {role === "PROMOTER" && (
                  <Link href="/organizer" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navLinkCls}`}>
                    Promotor
                  </Link>
                )}
                {role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navLinkCls}`}>
                    Admin
                  </Link>
                )}
                <Link href="/help" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navLinkCls}`}>
                  Ajuda
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full bg-neutral-900 text-white font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors mt-4"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)} className={`block py-2 ${navLinkCls}`}>
                  Ajuda
                </Link>
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold text-sm uppercase tracking-wide px-6 py-2.5 rounded-xl text-center mt-4"
                >
                  Entrar
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
