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
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const routes = [
    {
        label: "Overview",
        icon: LayoutDashboard,
        href: "/promotor",
        color: "text-sky-500",
    },
    {
        label: "Eventos",
        icon: Calendar,
        href: "/promotor/events",
        color: "text-violet-500",
    },
    {
        label: "Vendas",
        icon: Ticket,
        href: "/promotor/sales",
        color: "text-pink-700",
    },
    {
        label: "Check-in",
        icon: QrCode,
        href: "/promotor/checkin",
        color: "text-orange-700",
    },
    {
        label: "Analytics",
        icon: BarChart3,
        href: "/promotor/analytics",
        color: "text-emerald-500",
    },
    {
        label: "Equipa",
        icon: Users,
        href: "/promotor/team",
        color: "text-gray-500",
    },
    {
        label: "Definições",
        icon: Settings,
        href: "/promotor/settings",
    },
];

export function PromoterSidebar() {
    const pathname = usePathname();

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/promotor" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        {/* Logo placeholder */}
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold">
                            T
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">
                        Promotor
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                                pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/10"
                    onClick={() => signOut({ callbackUrl: '/' })}
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sair
                </Button>
            </div>
        </div>
    );
}
