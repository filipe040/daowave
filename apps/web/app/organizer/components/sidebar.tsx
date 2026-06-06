"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  LogOut,
  LayoutDashboard,
  Calendar,
  DollarSign,
  Ticket,
  Tags,
  FileText,
  Settings,
  Home,
  type LucideIcon,
} from "lucide-react";

const menuItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/organizer", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/organizer/events", label: "Eventos", icon: Calendar },
  { href: "/organizer/sales", label: "Vendas", icon: DollarSign },
  { href: "/organizer/tickets", label: "Bilhetes", icon: Ticket },
  { href: "/organizer/coupons", label: "Cupões", icon: Tags },
  { href: "/organizer/templates", label: "Modelos", icon: FileText },
  { href: "/organizer/settings", label: "Configurações", icon: Settings },
  { href: "/organizer/account", label: "Conta", icon: User },
];

interface OrganizerSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function OrganizerSidebar({ mobileOpen = false, onClose }: OrganizerSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Backdrop mobile */}
      <div
        className={`
          md:hidden fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 transition-opacity
          ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`
          w-64 flex-shrink-0 fixed left-0 top-0 h-screen border-r border-neutral-200 bg-white/95 backdrop-blur-xl z-50
          transform transition-transform duration-200 ease-out
          md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex min-h-0 flex-col h-full">
          <div className="md:hidden flex shrink-0 items-center justify-between p-4 border-b border-neutral-200">
            <span className="font-bold text-sm">Menu</span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
              aria-label="Fechar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="shrink-0 p-4 sm:p-6 border-b border-neutral-200">
            <Link href="/organizer" onClick={onClose} className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              GoPass
            </Link>
            <p className="text-xs text-neutral-500 mt-1">Área do Promotor</p>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/organizer" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                      ? "bg-violet-50 text-violet-700 font-semibold"
                      : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Home button */}
          <div className="shrink-0 px-4 pt-3 border-t border-neutral-200">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            >
              <Home className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-sm font-medium">Voltar ao site</span>
            </Link>
          </div>

          {session?.user && (
            <div className="shrink-0 p-4 border-t border-neutral-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-2xl border border-neutral-200 bg-neutral-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="h-5 w-5 text-zinc-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-neutral-900 truncate">
                    {(session.user as any).role || "PROMOTOR"}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">{session.user.email}</div>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full rounded-xl border border-neutral-200 border border-neutral-200 bg-neutral-50 text-neutral-700 px-4 py-2.5 flex items-center justify-center gap-2 transition-all hover:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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

