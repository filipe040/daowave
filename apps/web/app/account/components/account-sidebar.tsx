"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Shield,
  Bell,
  ShoppingBag,
  Ticket,
  FileText,
  Home,
  type LucideIcon,
} from "lucide-react";

const menuItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/account", label: "Resumo", icon: LayoutDashboard },
  { href: "/account/profile", label: "Dados pessoais", icon: User },
  { href: "/account/security", label: "Segurança", icon: Shield },
  { href: "/account/notifications", label: "Notificações", icon: Bell },
  { href: "/account/orders", label: "Compras", icon: ShoppingBag },
  { href: "/account/tickets", label: "Bilhetes", icon: Ticket },
  { href: "/account/legal", label: "Termos e privacidade", icon: FileText },
];

interface AccountSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function AccountSidebar({ mobileOpen = false, onClose }: AccountSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={`
          md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity
          ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`
          w-72 max-w-[85vw] fixed left-0 top-0 h-screen bg-zinc-950 border-r border-zinc-800 text-white z-[70]
          transform transition-transform duration-200 ease-out
          md:translate-x-0 md:max-w-none
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800">
          <span className="font-bold text-sm">Conta</span>
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
        <nav className="flex flex-col h-full p-4">
          <div className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const isActive =
              item.href === "/account"
                ? pathname === "/account"
                : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors
                  ${isActive ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"}
                `}
                data-testid={item.href === "/account" ? "nav-account-dashboard" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          </div>

          {/* Home button at the bottom */}
          <div className="pt-4 border-t border-zinc-800">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
            >
              <Home className="h-5 w-5 shrink-0" />
              Voltar ao site
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
