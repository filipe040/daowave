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
  UserCheck,
  Calendar,
  CalendarCheck,
  CreditCard,
  FileCheck,
  Shield,
  PlusCircle,
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

  const role = (session?.user as { role?: string })?.role;
  const isAdmin = role === "ADMIN";

  const section = useMemo(() => {
    if (currentSection) return currentSection;
    if (pathname.startsWith("/admin")) return "ADMINISTRAÇÃO";
    if (pathname.includes("/tickets")) return "BILHÉTICA & RECEITA";
    if (pathname.includes("/checkin")) return "CONTROLO DE ACESSO";
    return "DASHBOARD";
  }, [currentSection, pathname]);

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
        { label: "POS", icon: Database, disabled: true },
      ],
    };

    const experience: NavGroup = {
      title: "EXPERIÊNCIA & EQUIPA",
      items: eventId
        ? [
            { label: "Equipas", href: `${baseEvent}/teams`, icon: Users, activeMatch: (p) => p.includes("/teams") },
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

    const adminGroup: NavGroup = {
      title: "ADMINISTRAÇÃO",
      items: [
        { label: "Dashboard Admin", href: "/admin", icon: LayoutGrid, activeMatch: (p) => p === "/admin" },
        { label: "Utilizadores", href: "/admin/users", icon: Users },
        { label: "Promotores", href: "/admin/organizers", icon: UserCheck },
        { label: "Eventos", href: "/admin/events", icon: Calendar },
        { label: "Aprovar Eventos", href: "/admin/events/pending", icon: CalendarCheck },
        { label: "Pagamentos", href: "/admin/payments", icon: CreditCard },
        { label: "Auditoria", href: "/admin/audit", icon: FileCheck },
        { label: "Sistema", href: "/admin/system", icon: Shield },
        { label: "Definições", href: "/admin/settings", icon: Settings },
        { label: "Criar Evento", href: "/admin/events/new", icon: PlusCircle },
        { label: "Fix Session", href: "/admin/fix-session", icon: Wrench },
      ],
    };

    const allGroups = [management, experience, config, analytics, system];
    if (isAdmin) allGroups.push(adminGroup);
    return allGroups;
  }, [eventId, baseEvent, isAdmin]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        id="mobile-menu-button"
        className={cn(
          "lg:hidden fixed top-4 left-4 z-50 h-10 w-10 rounded-xl",
          "border border-border bg-card shadow-[var(--elevation-1)]",
          "text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        onClick={() => setIsMobileOpen((v) => !v)}
        aria-label="Abrir menu"
        type="button"
      >
        {isMobileOpen ? <X className="mx-auto h-5 w-5" /> : <Menu className="mx-auto h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-background/70 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        id="promoter-sidebar"
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72",
          "border-r border-border bg-background/80 backdrop-blur-2xl",
          "shadow-[0_18px_60px_rgba(0,0,0,.45)]",
          "transition-transform duration-300",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex min-h-0 flex-col h-full">
          {/* Brand */}
          <div className="shrink-0 px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl border border-border bg-card flex items-center justify-center shadow-[var(--elevation-1)]">
              <div className="grid grid-cols-2 gap-1">
                <span className="h-1.5 w-1.5 rounded-sm bg-foreground/90" />
                <span className="h-1.5 w-1.5 rounded-sm bg-foreground/90" />
                <span className="h-1.5 w-1.5 rounded-sm bg-foreground/90" />
                <span className="h-1.5 w-1.5 rounded-sm bg-foreground/90" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-foreground tracking-wide uppercase">
                EASYTICKET
              </div>
              <div className="text-[11px] text-muted-foreground truncate">{section}</div>
            </div>
          </div>
        </div>

          {/* Nav */}
          <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-5">
          {groups.map((g) => (
            <div key={g.title}>
              <div className="px-3 pb-2 text-[10px] tracking-wider uppercase text-muted-foreground">
                {g.title}
              </div>

              <div className="space-y-1">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const RightIcon = it.rightIcon;
                  const active = isActive(pathname, it.href, it.activeMatch);

                  const itemClass = cn(
                    "group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl",
                    "transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "bg-secondary text-foreground border border-border shadow-[var(--elevation-1)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                    it.disabled && "opacity-50 pointer-events-none"
                  );

                  const content = (
                    <>
                      <span
                        className={cn(
                          "h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0",
                          active ? "bg-foreground/8" : "bg-transparent group-hover:bg-foreground/8",
                          "transition-all"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", active ? "text-foreground" : "text-foreground/80")} />
                      </span>

                      <span className={cn("min-w-0 flex-1 truncate text-[13px] font-medium", active && "font-semibold")}>
                        {it.label}
                      </span>

                      {RightIcon && (
                        <span className="ml-2 flex-shrink-0">
                          <RightIcon className={cn("h-4 w-4", active ? "text-foreground/60" : "text-muted-foreground")} />
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
            <div className="shrink-0 border-t border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-2xl border border-border bg-card flex items-center justify-center shadow-[var(--elevation-1)]">
                <User className="h-5 w-5 text-foreground/80" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground truncate">
                  {(session.user as any).role || "USER"}
                </div>
                <div className="text-xs text-muted-foreground truncate">{session.user.email}</div>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/promotor/login" })}
              className={cn(
                "w-full rounded-xl border border-border bg-secondary",
                "text-foreground px-4 py-2.5 flex items-center justify-center gap-2",
                "transition-all duration-200 hover:opacity-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sair</span>
            </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}