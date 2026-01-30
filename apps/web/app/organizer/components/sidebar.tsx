"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const menuItems = [
  { href: "/organizer", label: "Dashboard", icon: "📊" },
  { href: "/organizer/events", label: "Eventos", icon: "🎫" },
  { href: "/organizer/sales", label: "Vendas", icon: "💰" },
  { href: "/organizer/tickets", label: "Bilhetes", icon: "🎟️" },
  { href: "/organizer/coupons", label: "Cupões", icon: "🎟️" },
  { href: "/organizer/templates", label: "Templates", icon: "📋" },
  { href: "/organizer/account", label: "Conta", icon: "⚙️" },
];

export default function OrganizerSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950/50 min-h-screen sticky top-0">
      <div className="p-6 border-b border-zinc-800">
        <Link href="/organizer" className="text-xl font-bold bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
          EasyTicket
        </Link>
        <p className="text-xs text-zinc-500 mt-1">Área do Promotor</p>
      </div>
      
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/organizer" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-white/10 text-white font-semibold"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
        <div className="text-xs text-zinc-500 mb-1">
          Logado como:
        </div>
        <div className="text-xs uppercase tracking-wider text-zinc-400 mb-1">
          {(session?.user as any)?.role || "USER"}
        </div>
        <div className="text-sm font-medium text-zinc-300 truncate">
          {session?.user?.email}
        </div>
      </div>
    </aside>
  );
}

