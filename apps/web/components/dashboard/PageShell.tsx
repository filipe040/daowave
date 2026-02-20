import React from "react";

interface PageShellProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}

export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
    return (
        <div className="min-h-full bg-[#f5f5f7]">
            {/* Page header */}
            <div className="bg-[#f5f5f7] border-b border-gray-200/80 px-6 sm:px-10 py-6">
                <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight truncate">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
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
            <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 space-y-6">
                {children}
            </div>
        </div>
    );
}
