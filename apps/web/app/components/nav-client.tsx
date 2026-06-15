"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Ticket, Search, Menu, X } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  USER: "Utilizador",
  ADMIN: "Admin",
  FINANCE_MANAGER: "Gestor financeiro",
  SUPPORT_AGENT: "Suporte",
};

function getInitials(name: string | null | undefined, email: string | undefined): string {
  if (name?.trim()) {
    return name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const res = await fetch("/api/account/profile");
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setLocalName(data.user?.name ?? undefined);
        setLocalAvatar(data.user?.avatarUrl ?? undefined);
      } catch { /* ignore */ }
    }
    loadProfile();
    return () => { mounted = false; };
  }, []);

  const displayName = localName ?? session?.user?.name ?? session?.user?.email ?? "";
  const avatarUrl = localAvatar ?? (session?.user as { avatarUrl?: string })?.avatarUrl ?? (session?.user as { image?: string })?.image;
  const role = (session?.user as { role?: string })?.role ?? "USER";
  const hasOrgAccess = (session?.user as { hasOrgAccess?: boolean })?.hasOrgAccess === true;
  const isPlatformAdmin =
    role === "ADMIN" || role === "FINANCE_MANAGER" || role === "SUPPORT_AGENT";
  const initials = getInitials(localName ?? session?.user?.name ?? null, session?.user?.email ?? undefined);

  const navLink = "text-sm font-semibold text-zinc-300 hover:text-white transition-colors";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.08] bg-[#0c0c12]/90 backdrop-blur-xl shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-[72px]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#00a0e3] to-[#0066aa] flex items-center justify-center shadow-lg shadow-[#00a0e3]/25 group-hover:shadow-[#00a0e3]/40 transition-shadow">
              <Ticket className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-black text-xl tracking-tight">LivePass</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link href="/events" className={navLink}>Eventos</Link>
            {session && <Link href="/my-tickets" className={navLink}>Meus bilhetes</Link>}
            <Link href="/help" className={navLink}>Ajuda</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/10 hover:text-white transition-all"
            >
              <Search className="h-4 w-4" />
              Pesquisar
            </Link>

            {session ? (
              <>
                <div className="hidden lg:flex items-center gap-3">
                  {isPlatformAdmin && (
                    <Link href="/admin" className={navLink}>
                      Admin
                    </Link>
                  )}
                  {(hasOrgAccess || role === "ADMIN") && (
                    <Link href="/promotor" className={navLink}>
                      Promotor
                    </Link>
                  )}
                  <Link href="/account" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-1 pr-3 py-1 hover:bg-white/10 transition-all">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-[#00a0e3]/20 flex items-center justify-center">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarDisplayUrl(avatarUrl) ?? ""} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-[#5ec8f8]">{initials}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-white max-w-[100px] truncate hidden xl:block">
                      {displayName.split(" ")[0]}
                    </span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-sm font-semibold text-zinc-500 hover:text-white transition-colors"
                  >
                    Sair
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-white"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="hidden lg:inline-flex rounded-full bg-[#00a0e3] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#0090cc] transition-colors shadow-lg shadow-[#00a0e3]/25"
                >
                  Entrar
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-white"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden pb-6 pt-2 border-t border-white/10 space-y-1">
            <Link href="/events" onClick={() => setMobileMenuOpen(false)} className={`block py-3 ${navLink}`}>Eventos</Link>
            {session && (
              <Link href="/my-tickets" onClick={() => setMobileMenuOpen(false)} className={`block py-3 ${navLink}`}>Meus bilhetes</Link>
            )}
            <Link href="/help" onClick={() => setMobileMenuOpen(false)} className={`block py-3 ${navLink}`}>Ajuda</Link>
            {session ? (
              <>
                <Link href="/account" onClick={() => setMobileMenuOpen(false)} className={`block py-3 ${navLink}`}>Conta</Link>
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setMobileMenuOpen(false); }}
                  className="w-full mt-4 rounded-xl bg-white/10 py-3 text-sm font-bold text-white"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="block mt-4 rounded-xl bg-[#00a0e3] py-3 text-center text-sm font-bold text-white"
              >
                Entrar
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
