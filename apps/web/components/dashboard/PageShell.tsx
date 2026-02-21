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
            <div className="bg-white/[0.02] border-b border-white/10 px-6 sm:px-10 py-8">
                <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-1 text-[14px] text-white/50">{subtitle}</p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
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
