"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  User,
  LogOut,
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  CalendarCheck,
  CreditCard,
  FileCheck,
  Shield,
  Settings,
  PlusCircle,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const menuItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilizadores", icon: Users },
  { href: "/admin/organizers", label: "Promotores", icon: UserCheck },
  { href: "/admin/events", label: "Eventos", icon: Calendar },
  { href: "/admin/events/pending", label: "Aprovar Eventos", icon: CalendarCheck },
  { href: "/admin/payments", label: "Pagamentos", icon: CreditCard },
  { href: "/admin/audit", label: "Auditoria", icon: FileCheck },
  { href: "/admin/system", label: "Sistema", icon: Shield },
  { href: "/admin/settings", label: "Definições", icon: Settings },
  { href: "/admin/events/new", label: "Criar Evento", icon: PlusCircle },
  { href: "/admin/fix-session", label: "Fix Session", icon: Wrench },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Backdrop mobile: z-[60] para ficar acima da barra admin e da navbar */}
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
        {/* Close button mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800">
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
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-zinc-800">
            <Link href="/admin" onClick={onClose} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">A</div>
              <div>
                <div className="font-bold text-sm">Admin Dashboard</div>
                <div className="text-xs text-zinc-400">Gestão & Administração</div>
              </div>
            </Link>
          </div>

          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
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
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {session?.user && (
            <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-2xl border border-zinc-700 bg-zinc-800/80 flex items-center justify-center flex-shrink-0 shadow-sm">
              <User className="h-5 w-5 text-zinc-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">
                {(session.user as any).role || "ADMIN"}
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

