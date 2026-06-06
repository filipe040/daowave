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
            <div className="border-b border-neutral-200/80 bg-white/60 backdrop-blur-sm px-4 sm:px-8 md:px-12 py-8 sm:py-10 md:py-12">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
                    {backButton && (
                        <a
                            href={backButton.href}
                            className="inline-flex items-center gap-2 text-neutral-500 hover:text-violet-700 text-[13px] font-bold transition-colors group mb-2"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-neutral-100 group-hover:bg-violet-600 group-hover:text-white transition-all">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                                </svg>
                            </div>
                            {backButton.label || "Voltar"}
                        </a>
                    )}
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0 space-y-2">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight break-words">
                                {title}
                            </h1>
                            {subtitle && (
                                <div className="text-[14px] sm:text-[16px] md:text-[17px] text-neutral-500 font-medium leading-relaxed max-w-2xl">{subtitle}</div>
                            )}
                        </div>
                        {actions && (
                            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 shrink-0 pb-1 mt-2 lg:mt-0 w-full lg:w-auto">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
                {children}
            </div>
        </div>
    );
}
