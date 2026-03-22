"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Building2,
    Calendar,
    Users,
    ShieldAlert,
    Monitor,
    LogOut,
    ScrollText,
    Mail,
} from "lucide-react";
import { signOut } from "next-auth/react";

const routes = [
    { label: "Visão Geral", icon: LayoutDashboard, href: "/admin", exact: true },
    { label: "Organizações", icon: Building2, href: "/admin/organizations" },
    { label: "Eventos", icon: Calendar, href: "/admin/events" },
    { label: "Utilizadores", icon: Users, href: "/admin/users" },
    { label: "Marketing", icon: Mail, href: "/admin/marketing" },
    { label: "Anti-Fraude", icon: ShieldAlert, href: "/admin/fraud" },
    { label: "Sistema", icon: Monitor, href: "/admin/system" },
    { label: "Registos de Auditoria", icon: ScrollText, href: "/admin/audit-logs" },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-black/95 backdrop-blur-xl border-r border-white/10">
            {/* Logo */}
            <div className="px-6 pt-8 pb-6 border-b border-white/5">
                <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black text-xs font-bold shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        A
                    </div>
                    <span className="text-[15px] font-bold text-white tracking-tight uppercase">Dashboard Admin</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                {routes.map((route) => {
                    const active = route.exact
                        ? pathname === route.href
                        : pathname.startsWith(route.href);

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                active
                                    ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                                    : "text-white/40 hover:bg-white/5 hover:text-white/80"
                            )}
                        >
                            <route.icon
                                className={cn("h-4.5 w-4.5 shrink-0", active ? "text-white" : "text-white/30")}
                                strokeWidth={active ? 2 : 1.5}
                            />
                            <span className="tracking-wide">{route.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-4 pb-8 border-t border-white/5 pt-4">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                >
                    <LogOut className="h-4.5 w-4.5 text-white/30 group-hover:text-red-400" strokeWidth={1.5} />
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );
}
