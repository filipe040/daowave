"use client";

import { useState } from "react";
import { PromoterSidebar } from "@/components/promoter/PromoterSidebar";
import { Menu, X } from "lucide-react";

export function PromoterLayoutClient({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="h-full flex bg-[#f5f5f7]">
            {/* Desktop sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
                <PromoterSidebar />
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={closeSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Mobile sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
            >
                <PromoterSidebar onNavClick={closeSidebar} />
            </div>

            {/* Main content */}
            <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
                {/* Mobile header */}
                <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-200/80 shadow-sm sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                    <span className="text-sm font-semibold text-gray-900">Daowave Promotor</span>
                </div>

                <main className="flex-1">{children}</main>
            </div>
        </div>
    );
}
