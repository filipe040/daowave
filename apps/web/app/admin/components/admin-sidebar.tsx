"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
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
          w-72 fixed left-0 top-0 h-screen bg-zinc-950 border-r border-zinc-800 text-white z-50
          transform transition-transform duration-200 ease-out
          md:translate-x-0
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
      <div className="p-4 border-b border-zinc-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold">A</div>
          <div>
            <div className="font-bold text-sm">Admin Console</div>
            <div className="text-xs text-zinc-400">Gestão & Administração</div>
          </div>
        </Link>
      </div>

      <nav className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-160px)]">
        <div>
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Gestão</div>
          <div className="space-y-1">
            <Link href="/admin/users" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/users") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Utilizadores
            </Link>
            <Link href="/admin/organizers" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/organizers") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Promotores
            </Link>
            <Link href="/admin/events" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/events") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Eventos
            </Link>
            <Link href="/admin/events/pending" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/events/pending") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Aprovar Eventos
            </Link>
            <Link href="/admin/payments" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/payments") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Pagamentos
            </Link>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Administração</div>
          <div className="space-y-1">
            <Link href="/admin/audit" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/audit") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Auditoria
            </Link>
            <Link href="/admin/system" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/system") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Sistema
            </Link>
            <Link href="/admin/settings" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/settings") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Definições
            </Link>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Ferramentas</div>
          <div className="space-y-1">
            <Link href="/admin/events/new" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/events/new") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Criar Evento
            </Link>
            <Link href="/admin/fix-session" className={`block px-3 py-2 rounded ${pathname?.startsWith("/admin/fix-session") ? "bg-zinc-800" : "hover:bg-zinc-900"}`}>
              Fix Session
            </Link>
          </div>
        </div>
      </nav>

      {session?.user && (
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-sm font-semibold">
              {(session.user.name || session.user.email || "U").slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{session.user.name || "Admin"}</div>
              <div className="text-xs text-zinc-400 truncate">{session.user.email}</div>
              <div className="text-[10px] text-zinc-500 uppercase mt-1">{(session.user as any).role}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users" className="flex-1 px-3 py-2 rounded bg-zinc-800 text-center" onClick={onClose}>Conta</Link>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="flex-1 px-3 py-2 rounded bg-zinc-700">Sair</button>
          </div>
        </div>
      )}
    </aside>
    </>
  );
}

