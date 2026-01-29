"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutGrid,
  Ticket,
  ShieldCheck,
  Wallet,
  Users,
  Brush,
  Images,
  Settings,
  Bell,
  Plug,
  BarChart3,
  Database,
  Wrench,
  Bolt,
  Building2,
  LogOut,
  User,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface PromoterSidebarProps {
  eventId?: string;
  currentSection?: string;
}

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  activeMatch?: (pathname: string) => boolean;
  rightIcon?: React.ElementType;
  disabled?: boolean;
  onClick?: () => void;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function isActive(pathname: string, href?: string, match?: (p: string) => boolean) {
  if (match) return match(pathname);
  if (!href) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export default function PromoterSidebar({ eventId, currentSection }: PromoterSidebarProps) {
  const pathname = usePathname() || "";
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Determine current section from pathname
  const section = useMemo(() => {
    if (currentSection) return currentSection;
    if (pathname.includes("/tickets")) return "BILHÉTICA & RECEITA";
    if (pathname.includes("/checkin")) return "CONTROLO DE ACESSO";
    return "DASHBOARD";
  }, [currentSection, pathname]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const sidebar = document.getElementById("promoter-sidebar");
      const button = document.getElementById("mobile-menu-button");
      if (
        isMobileOpen &&
        sidebar &&
        !sidebar.contains(e.target as Node) &&
        !button?.contains(e.target as Node)
      ) {
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileOpen]);

  // Base URLs
  const baseEvent = eventId ? `/promotor/events/${eventId}` : "/promotor";

  const groups: NavGroup[] = useMemo(() => {
    const studioTitle = eventId ? "ESTÚDIO DO EVENTO" : "PAINEL DO PROMOTOR";

    const management: NavGroup = {
      title: studioTitle,
      items: [
        {
          label: "Dashboard",
          href: eventId ? baseEvent : "/promotor",
          icon: LayoutGrid,
          // safer match
          activeMatch: (p) => (eventId ? p === baseEvent || p.startsWith(baseEvent + "/") : p === "/promotor"),
        },
        ...(eventId
          ? ([
              { label: "Bilhética", href: `${baseEvent}/tickets`, icon: Ticket },
              {
                label: "Acesso",
                href: `/promotor/checkin/${eventId}`,
                icon: ShieldCheck,
                activeMatch: (p) => p.includes("/checkin"),
              },
              { label: "Carteiras", href: `${baseEvent}/carteiras`, icon: Wallet },
            ] as NavItem[])
          : ([] as NavItem[])),
        {
          label: "POS",
          icon: Database,
          disabled: true,
        },
      ],
    };

    const experience: NavGroup = {
      title: "EXPERIÊNCIA & EQUIPA",
      items: eventId
        ? [
            {
              label: "Equipas",
              href: `${baseEvent}/teams`,
              icon: Users,
              activeMatch: (p) => p.includes("/teams"),
            },
            {
              label: "Branding & landing page",
              href: `${baseEvent}/branding`,
              icon: Brush,
              activeMatch: (p) => p.includes("/branding"),
            },
            {
              label: "Biblioteca de assets",
              href: `${baseEvent}/assets`,
              icon: Images,
              activeMatch: (p) => p.includes("/assets"),
            },
            {
              label: "Definições do evento",
              href: `${baseEvent}/settings`,
              icon: Settings,
              activeMatch: (p) => p.includes("/settings"),
            },
          ]
        : [{ label: "Branding & equipas", icon: Users, disabled: true }],
    };

    const config: NavGroup = {
      title: "CONFIGURAÇÃO",
      items: [
        { label: "Integrações", icon: Plug, rightIcon: ChevronRight, disabled: true },
        { label: "Notificações", icon: Bell, rightIcon: ChevronRight, disabled: true },
        { label: "Definições", icon: Settings, disabled: true },
      ],
    };

    const analytics: NavGroup = {
      title: "ANÁLISE",
      items: [
        { label: "Relatórios", icon: BarChart3, rightIcon: ChevronRight, disabled: true },
        { label: "Auditoria", icon: Database, rightIcon: ChevronRight, disabled: true },
      ],
    };

    const system: NavGroup = {
      title: "SISTEMA",
      items: [
        { label: "Manutenção", icon: Wrench, rightIcon: ChevronRight, disabled: true },
        { label: "Jobs", icon: Bolt, disabled: true },
        { label: "Tenants", icon: Building2, disabled: true },
      ],
    };

    return [management, experience, config, analytics, system];
  }, [eventId, baseEvent]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        id="mobile-menu-button"
        className={cn(
          "lg:hidden fixed top-4 left-4 z-50 h-10 w-10",
          "rounded-xl border border-white/10",
          "bg-white/5 backdrop-blur-xl",
          "text-white/85 shadow-[0_18px_60px_rgba(0,0,0,.45)]"
        )}
        onClick={() => setIsMobileOpen((v) => !v)}
        aria-label="Abrir menu"
        type="button"
      >
        {isMobileOpen ? <X className="mx-auto h-5 w-5" /> : <Menu className="mx-auto h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside
        id="promoter-sidebar"
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64",
          "border-r border-white/10",
          "bg-black/40 backdrop-blur-2xl",
          "shadow-[0_18px_60px_rgba(0,0,0,.45)]",
          "transition-transform duration-300",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl border border-white/15 bg-white/5 backdrop-blur-xl flex items-center justify-center">
              <div className="grid grid-cols-2 gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-white/85" />
                <span className="h-1.5 w-1.5 rounded-sm bg-white/85" />
                <span className="h-1.5 w-1.5 rounded-sm bg-white/85" />
                <span className="h-1.5 w-1.5 rounded-sm bg-white/85" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white/90 tracking-wide uppercase">5IVE TICKETS</div>
              <div className="text-[11px] text-white/55 truncate">{section}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="px-3 pb-2 text-[10px] tracking-wider uppercase text-white/45">{g.title}</div>

              <div className="space-y-1">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const RightIcon = it.rightIcon;
                  const active = isActive(pathname, it.href, it.activeMatch);

                  const itemClass = cn(
                    "group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
                    "transition-all duration-200",
                    active
                      ? "bg-white text-black shadow-[0_18px_60px_rgba(0,0,0,.35)]"
                      : "text-white/70 hover:text-white hover:bg-white/6",
                    it.disabled && "opacity-50 pointer-events-none"
                  );

                  const content = (
                    <>
                      <span
                        className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0",
                          active ? "bg-black/8" : "bg-white/0 group-hover:bg-white/6",
                          "transition-all"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", active ? "text-black/80" : "text-white/80")} />
                      </span>

                      <span className={cn("text-[13px] font-medium", active && "font-semibold")}>{it.label}</span>

                      {RightIcon && (
                        <span className="ml-auto">
                          <RightIcon className={cn("h-4 w-4", active ? "text-black/50" : "text-white/35")} />
                        </span>
                      )}
                    </>
                  );

                  if (it.href) {
                    return (
                      <Link
                        key={it.label}
                        href={it.href}
                        className={itemClass}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <button key={it.label} className={itemClass} onClick={it.onClick} type="button">
                      {content}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Account */}
        {session?.user && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white/70" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white/90 truncate">{(session.user as any).role || "USER"}</div>
                <div className="text-xs text-white/60 truncate">{session.user.email}</div>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/promotor/login" })}
              className={cn(
                "w-full rounded-xl border border-white/10",
                "bg-white/5 hover:bg-white/8",
                "text-white/75 hover:text-white",
                "px-4 py-2.5 flex items-center justify-center gap-2",
                "transition-all duration-200"
              )}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}