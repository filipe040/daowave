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
    Tag,
    Home,
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
    { label: "Cupão de desconto", icon: Tag, href: "/promotor/settings/coupon" },
    { label: "Equipa", icon: Users, href: "/promotor/team" },
    { label: "Definições", icon: Settings, href: "/promotor/settings" },
];

interface PromoterSidebarProps {
    onNavClick?: () => void;
}

export function PromoterSidebar({ onNavClick }: PromoterSidebarProps) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-white border-r border-neutral-200 shadow-sm">
            <div className="px-6 pt-8 pb-6 border-b border-neutral-100">
                <Link href="/promotor" onClick={onNavClick} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Layers className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <span className="text-[13px] font-black text-neutral-900 uppercase tracking-[0.15em] leading-none block">GoPass</span>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1 block">Promotor</span>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
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
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 group",
                                active
                                    ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                                    : "text-neutral-600 hover:text-violet-700 hover:bg-violet-50"
                            )}
                        >
                            <route.icon
                                className={cn(
                                    "h-4 w-4 shrink-0 transition-transform",
                                    active ? "text-white" : "text-neutral-400 group-hover:text-violet-600"
                                )}
                                strokeWidth={active ? 2.5 : 2}
                            />
                            <span className="tracking-tight">{route.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="px-3 pb-8 pt-4 border-t border-neutral-100 space-y-1">
                <Link
                    href="/"
                    onClick={onNavClick}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[13px] font-semibold text-neutral-600 hover:text-violet-700 hover:bg-violet-50 border border-transparent hover:border-violet-100 transition-all group"
                >
                    <Home className="h-4 w-4 text-neutral-400 group-hover:text-violet-600 transition-colors" strokeWidth={2} />
                    <span>Voltar ao início</span>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[13px] font-semibold text-neutral-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all group"
                >
                    <LogOut className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
                    <span>Terminar Sessão</span>
                </button>
            </div>
        </div>
    );
}
