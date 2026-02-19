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
    Settings,
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const routes = [
    {
        label: "Overview",
        icon: LayoutDashboard,
        href: "/admin",
        color: "text-sky-500",
    },
    {
        label: "Organizações",
        icon: Building2,
        href: "/admin/organizations",
        color: "text-violet-500",
    },
    {
        label: "Eventos",
        icon: Calendar,
        href: "/admin/events",
        color: "text-pink-700",
    },
    {
        label: "Utilizadores",
        icon: Users,
        href: "/admin/users",
        color: "text-orange-700",
    },
    {
        label: "Anti-Fraude",
        icon: ShieldAlert,
        href: "/admin/fraud",
        color: "text-red-500",
    },
    {
        label: "Sistema",
        icon: Settings,
        href: "/admin/system",
    },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-[#111827] text-white">
            <div className="px-3 py-2 flex-1">
                <Link href="/admin" className="flex items-center pl-3 mb-14">
                    <div className="relative w-8 h-8 mr-4">
                        <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white font-bold">
                            A
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold">
                        Admin
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
