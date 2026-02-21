import React from "react";

interface PageShellProps {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
    return (
        <div className="min-h-full bg-transparent">
            {/* Page header */}
            <div className="bg-transparent border-b border-white/5 px-8 sm:px-12 py-10 sm:py-16">
                <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0 space-y-2">
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight -ml-1">
                            {title}
                        </h1>
                        {subtitle && (
                            <div className="text-[16px] sm:text-[18px] text-white/40 font-medium leading-relaxed max-w-2xl">{subtitle}</div>
                        )}
                    </div>
                    {actions && (
                        <div className="flex flex-wrap items-center gap-3 shrink-0 pb-1">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {/* Page content */}
            <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 space-y-8">
                {children}
            </div>
        </div>
    );
}
