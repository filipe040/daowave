import React from "react";

interface PageShellProps {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
    backButton?: {
        href: string;
        label?: string;
    };
}

export function PageShell({ title, subtitle, actions, children, backButton }: PageShellProps) {
    return (
        <div className="min-h-full bg-transparent">
            {/* Page header */}
            <div className="bg-transparent border-b border-white/5 px-8 sm:px-12 py-10 sm:py-16">
                <div className="max-w-7xl mx-auto space-y-8">
                    {backButton && (
                        <a
                            href={backButton.href}
                            className="inline-flex items-center gap-2 text-white/40 hover:text-white text-[13px] font-bold transition-colors group mb-2"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 group-hover:bg-white group-hover:text-black transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </div>
                            {backButton.label || "Voltar"}
                        </a>
                    )}
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
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
            </div>

            {/* Page content */}
            <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 space-y-8">
                {children}
            </div>
        </div>
    );
}
