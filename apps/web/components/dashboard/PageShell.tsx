import React from "react";

interface PageShellProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
    return (
        <div className="flex-1 space-y-6 p-4 sm:p-6 pt-5 sm:pt-6 max-w-[1400px] mx-auto w-full">
            {/* Header: stacks on mobile, row on sm+ */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-xs sm:text-sm text-zinc-400 mt-1">{subtitle}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}
