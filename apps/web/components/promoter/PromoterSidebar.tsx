"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Calendar,
    Ticket,
    BarChart3,
    Settings,
    Users,
    QrCode,
    LogOut,
    Banknote,
} from "lucide-react";
import { signOut } from "next-auth/react";

const routes = [
    { label: "Overview", icon: LayoutDashboard, href: "/promotor", exact: true },
    { label: "Eventos", icon: Calendar, href: "/promotor/events" },
    { label: "Vendas", icon: Ticket, href: "/promotor/sales" },
    { label: "Check-in", icon: QrCode, href: "/promotor/checkin" },
    { label: "Analytics", icon: BarChart3, href: "/promotor/analytics" },
    { label: "Finanças", icon: Banknote, href: "/promotor/finance" },
    { label: "Equipa", icon: Users, href: "/promotor/team" },
    { label: "Definições", icon: Settings, href: "/promotor/settings" },
];

export function PromoterSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200/80">
            {/* Logo */}
            <div className="px-5 pt-6 pb-4 border-b border-gray-100">
                <Link href="/promotor" className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        T
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Promotor</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {routes.map((route) => {
                    const active = route.exact
                        ? pathname === route.href
                        : pathname.startsWith(route.href);

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                                active
                                    ? "bg-gray-100 text-gray-900"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <route.icon
                                className={cn("h-4 w-4 shrink-0", active ? "text-gray-900" : "text-gray-400")}
                                strokeWidth={active ? 2 : 1.75}
                            />
                            {route.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-5 border-t border-gray-100 pt-3">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150"
                >
                    <LogOut className="h-4 w-4 text-gray-400" strokeWidth={1.75} />
                    Sair
                </button>
            </div>
        </div>
    );
}
