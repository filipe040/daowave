"use client";

import { useState } from "react";
import { PromoterSidebar } from "@/components/promoter/PromoterSidebar";
import { Menu, X } from "lucide-react";

import { MemberRole } from "@prisma/client";

export function PromoterLayoutClient({
    children,
    memberRole,
}: {
    children: React.ReactNode;
    memberRole: MemberRole | string;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="h-full flex min-h-screen dash-shell">
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
                <PromoterSidebar memberRole={memberRole} />
            </div>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-sm md:hidden"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out md:hidden shadow-xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <PromoterSidebar onNavClick={closeSidebar} memberRole={memberRole} />
            </div>

            <div className="flex-1 md:pl-64 flex flex-col min-h-screen relative">
                <div className="md:hidden flex items-center gap-4 px-6 h-16 bg-[#14141f]/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all"
                        aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                    <span className="text-[15px] font-bold text-white tracking-tight">Painel Promotor</span>
                </div>

                <main className="flex-1 relative z-10">{children}</main>
            </div>
        </div>
    );
}
