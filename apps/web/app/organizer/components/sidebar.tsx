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
  type LucideIcon,
} from "lucide-react";

const menuItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/organizer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/organizer/events", label: "Eventos", icon: Calendar },
  { href: "/organizer/sales", label: "Vendas", icon: DollarSign },
  { href: "/organizer/tickets", label: "Bilhetes", icon: Ticket },
  { href: "/organizer/coupons", label: "Cupões", icon: Tags },
  { href: "/organizer/templates", label: "Templates", icon: FileText },
  { href: "/organizer/account", label: "Conta", icon: Settings },
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
          md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity
          ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`
          w-64 flex-shrink-0 fixed left-0 top-0 h-screen border-r border-zinc-800 bg-zinc-950/95 backdrop-blur-xl z-50
          transform transition-transform duration-200 ease-out
          md:translate-x-0
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex min-h-0 flex-col h-full">
          <div className="md:hidden flex shrink-0 items-center justify-between p-4 border-b border-zinc-800">
            <span className="font-bold text-sm">Menu</span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              aria-label="Fechar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="shrink-0 p-4 sm:p-6 border-b border-zinc-800">
            <Link href="/organizer" onClick={onClose} className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
              EasyTicket
            </Link>
            <p className="text-xs text-zinc-500 mt-1">Área do Promotor</p>
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? "bg-white/10 text-white font-semibold"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {session?.user && (
            <div className="shrink-0 p-4 border-t border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-2xl border border-zinc-700 bg-zinc-800/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="h-5 w-5 text-zinc-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">
                    {(session.user as any).role || "PROMOTOR"}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">{session.user.email}</div>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 text-white px-4 py-2.5 flex items-center justify-center gap-2 transition-all hover:bg-zinc-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
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

