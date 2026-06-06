"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu, X } from "lucide-react";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="dark h-full flex bg-black">
            {/* Desktop sidebar */}
            <div className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 z-30">
                <AdminSidebar />
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile sidebar drawer */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-60 transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <AdminSidebar />
            </div>

            {/* Main content */}
            <div className="flex-1 md:pl-60 flex flex-col min-h-screen relative overflow-hidden">
                {/* Background glow */}
                <div className="pointer-events-none fixed inset-0 z-0">
                    <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-white/[0.02] blur-[120px]" />
                    <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-white/[0.01] blur-[100px]" />
                </div>

                {/* Mobile header */}
                <div className="md:hidden flex items-center gap-4 px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-20">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
                        aria-label="Menu"
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                    <span className="text-[15px] font-bold text-white tracking-tight uppercase">Admin</span>
                </div>

                <main className="flex-1 relative z-10">{children}</main>
            </div>
        </div>
    );
}
