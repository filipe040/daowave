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
    Home,
    Banknote,
    MessageSquare,
} from "lucide-react";
import { adminNavAllowed } from "@/lib/auth/admin-access";
import { signOut } from "next-auth/react";

const routes = [
    { label: "Visão Geral", icon: LayoutDashboard, href: "/admin", exact: true },
    { label: "Organizações", icon: Building2, href: "/admin/organizations" },
    { label: "Eventos", icon: Calendar, href: "/admin/events" },
    { label: "Utilizadores", icon: Users, href: "/admin/users" },
    { label: "Marketing", icon: Mail, href: "/admin/marketing" },
    { label: "Contactos", icon: MessageSquare, href: "/admin/contact" },
    { label: "Finanças", icon: Banknote, href: "/admin/finance" },
    { label: "Anti-Fraude", icon: ShieldAlert, href: "/admin/fraud" },
    { label: "Sistema", icon: Monitor, href: "/admin/system" },
    { label: "Registos de Auditoria", icon: ScrollText, href: "/admin/audit-logs" },
];

export function AdminSidebar({ adminRole }: { adminRole?: string }) {
    const pathname = usePathname();
    const visibleRoutes = routes.filter((route) => adminNavAllowed(route.href, adminRole));

    return (
        <div className="flex flex-col h-full bg-[#0a0a10] border-r border-white/10">
            <div className="px-6 pt-8 pb-6 border-b border-white/10">
                <Link href="/admin" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00a0e3] to-[#0066aa] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-lg shadow-[#00a0e3]/20">
                        A
                    </div>
                    <span className="text-[14px] font-bold text-white tracking-tight">Admin LivePass</span>
                </Link>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {visibleRoutes.map((route) => {
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
                                    ? "bg-[#00a0e3] text-white shadow-lg shadow-[#00a0e3]/20"
                                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <route.icon
                                className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-zinc-500")}
                                strokeWidth={active ? 2 : 1.5}
                            />
                            <span className="tracking-wide">{route.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="px-3 pb-8 border-t border-white/10 pt-4 space-y-1">
                <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all duration-200"
                >
                    <Home className="h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.5} />
                    <span>Voltar ao início</span>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-medium text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
                >
                    <LogOut className="h-4 w-4 group-hover:text-red-400" strokeWidth={1.5} />
                    <span>Sair</span>
                </button>
            </div>
        </div>
    );
}
