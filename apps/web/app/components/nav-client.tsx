"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { Ticket, Search, Menu, X, LayoutDashboard, ChevronDown } from "lucide-react";
import {
  getActiveStaffDashboardLabel,
  getStaffDashboardOptions,
  getStaffDashboardPath,
  isStaffAccount,
} from "@/lib/auth/public-nav";

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

const staffPillClass =
  "flex items-center gap-2 rounded-full border border-[#00a0e3]/30 bg-[#00a0e3]/10 pl-1 pr-3 py-1 hover:bg-[#00a0e3]/20 transition-all";

function StaffDashboardPill({
  role,
  hasOrgAccess,
}: {
  role: string;
  hasOrgAccess: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options = getStaffDashboardOptions(role, hasOrgAccess);
  const label = getActiveStaffDashboardLabel(pathname, role, hasOrgAccess);
  const href = getStaffDashboardPath(role, hasOrgAccess) ?? options[0]?.href ?? "/promotor";

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const icon = (
    <div className="h-8 w-8 rounded-full bg-[#00a0e3]/25 flex items-center justify-center shrink-0">
      <LayoutDashboard className="h-4 w-4 text-[#5ec8f8]" />
    </div>
  );

  if (options.length <= 1) {
    return (
      <Link href={href} className={staffPillClass}>
        {icon}
        <span className="text-sm font-semibold text-white max-w-[120px] truncate hidden xl:block">
          {label}
        </span>
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={staffPillClass}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {icon}
        <span className="text-sm font-semibold text-white max-w-[120px] truncate hidden xl:block">
          {label}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#5ec8f8] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 min-w-[220px] rounded-xl border border-white/10 bg-[#0c0c12] py-1 shadow-xl shadow-black/40 z-50"
        >
          {options.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              role="option"
              aria-selected={pathname?.startsWith(opt.href) ?? false}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 text-sm font-semibold transition-colors ${
                pathname?.startsWith(opt.href)
                  ? "text-[#5ec8f8] bg-[#00a0e3]/10"
                  : "text-zinc-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NavClient() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [localName, setLocalName] = useState<string | undefined>(undefined);
  const [localAvatar, setLocalAvatar] = useState<string | undefined>(undefined);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const role = (session?.user as { role?: string })?.role ?? "USER";
  const hasOrgAccess = (session?.user as { hasOrgAccess?: boolean })?.hasOrgAccess === true;
  const staffPath = getStaffDashboardPath(role, hasOrgAccess);
  const staffDashboardOptions = getStaffDashboardOptions(role, hasOrgAccess);
  const isStaff = isStaffAccount(role, hasOrgAccess);
  const initials = getInitials(localName ?? session?.user?.name ?? null, session?.user?.email ?? undefined);

  useEffect(() => {
    if (!session || isStaff) return;
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
  }, [session, isStaff]);

  const displayName = localName ?? session?.user?.name ?? session?.user?.email ?? "";
  const avatarUrl = localAvatar ?? (session?.user as { avatarUrl?: string })?.avatarUrl ?? (session?.user as { image?: string })?.image;

  const navLink = "text-sm font-semibold text-zinc-300 hover:text-white transition-colors";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.08] bg-[#0c0c12]/95 backdrop-blur-xl shadow-xl shadow-black/30"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-[68px]">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00a0e3] to-[#0055aa] flex items-center justify-center shadow-lg shadow-[#00a0e3]/30 group-hover:shadow-[#00a0e3]/50 transition-all group-hover:scale-105">
              <Ticket className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-black text-lg tracking-tight">LivePass</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <Link href="/events" className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all">Eventos</Link>
            {session && !isStaff && (
              <Link href="/my-tickets" className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all">Meus bilhetes</Link>
            )}
            <Link href="/help" className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all">Ajuda</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/events"
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-white/8 hover:text-zinc-200 hover:border-white/15 transition-all"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Pesquisar eventos…</span>
            </Link>

            {session ? (
              <>
                <div className="hidden lg:flex items-center gap-3">
                  {isStaff && staffPath ? (
                    <StaffDashboardPill role={role} hasOrgAccess={hasOrgAccess} />
                  ) : (
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
                  )}
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
            {session && !isStaff && (
              <Link href="/my-tickets" onClick={() => setMobileMenuOpen(false)} className={`block py-3 ${navLink}`}>Meus bilhetes</Link>
            )}
            <Link href="/help" onClick={() => setMobileMenuOpen(false)} className={`block py-3 ${navLink}`}>Ajuda</Link>
            {session ? (
              <>
                {isStaff && staffPath && (
                  staffDashboardOptions.length > 1 ? (
                    staffDashboardOptions.map((opt) => (
                      <Link
                        key={opt.href}
                        href={opt.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block py-3 ${navLink} ${
                          pathname?.startsWith(opt.href) ? "text-[#5ec8f8]" : ""
                        }`}
                      >
                        {opt.label}
                      </Link>
                    ))
                  ) : (
                    <Link
                      href={staffPath}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block py-3 ${navLink}`}
                    >
                      {getActiveStaffDashboardLabel(null, role, hasOrgAccess)}
                    </Link>
                  )
                )}
                {!isStaff && (
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)} className={`block py-3 ${navLink}`}>
                    Conta
                  </Link>
                )}
                {isStaff && (
                  <Link href="/account/security" onClick={() => setMobileMenuOpen(false)} className={`block py-3 ${navLink}`}>
                    Segurança da conta
                  </Link>
                )}
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
