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
    Layers,
    CircleDollarSign,
    FileText,
} from "lucide-react";
import { signOut } from "next-auth/react";

const routes = [
    { label: "Overview", icon: LayoutDashboard, href: "/promotor", exact: true },
    { label: "Eventos", icon: Calendar, href: "/promotor/events" },
    { label: "Vendas", icon: Ticket, href: "/promotor/sales" },
    { label: "Check-in", icon: QrCode, href: "/promotor/checkin" },
    { label: "Venda Manual (POS)", icon: CircleDollarSign, href: "/promotor/sales/manual" },
    { label: "Analytics", icon: BarChart3, href: "/promotor/analytics" },
    { label: "Finanças", icon: Banknote, href: "/promotor/finance" },
    { label: "Design Bilhetes", icon: Layers, href: "/promotor/settings/tickets" },
    { label: "Design Faturas", icon: FileText, href: "/promotor/settings/invoices" },
    { label: "Equipa", icon: Users, href: "/promotor/team" },
    { label: "Definições", icon: Settings, href: "/promotor/settings" },
];

interface PromoterSidebarProps {
    onNavClick?: () => void;
}

export function PromoterSidebar({ onNavClick }: PromoterSidebarProps) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl border-r border-white/5 shadow-2xl">
            {/* Logo Section */}
            <div className="px-8 pt-10 pb-8 flex items-center justify-between">
                <Link href="/promotor" onClick={onNavClick} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-white/80 p-[1px] shadow-lg shadow-white/5 group-hover:scale-105 transition-all">
                        <div className="w-full h-full rounded-[15px] bg-black flex items-center justify-center">
                            <Layers className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                    </div>
                    <div>
                        <span className="text-[13px] font-black text-white uppercase tracking-[0.2em] leading-none block">GoPass</span>
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1 block">Promotor</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
                {routes.map((route) => {
                    const active = route.exact
                        ? pathname === route.href
                        : pathname.startsWith(route.href);

                    return (
                        <Link
                            key={route.href}
                            href={route.href}
                            onClick={onNavClick}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-[18px] text-[13px] font-bold transition-all duration-300 group",
                                active
                                    ? "bg-white text-black shadow-xl shadow-white/5 scale-[1.02]"
                                    : "text-white/40 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <route.icon
                                className={cn(
                                    "h-4.5 w-4.5 transition-transform duration-300",
                                    active ? "text-black scale-110" : "text-white/20 group-hover:text-white group-hover:scale-110"
                                )}
                                strokeWidth={active ? 2.5 : 2}
                            />
                            <span className="tracking-tight">{route.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User / Footer Section */}
            <div className="px-4 pb-10 pt-6 border-t border-white/5 bg-black/20">
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-4 py-4 w-full rounded-2xl text-[13px] font-bold text-white/40 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all duration-300 group"
                >
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                        <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                    </div>
                    <span className="tracking-tight">Terminar Sessão</span>
                </button>
            </div>
        </div>
    );
}
