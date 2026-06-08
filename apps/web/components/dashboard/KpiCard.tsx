import { LucideIcon } from "lucide-react";

interface KpiCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
    /** Destaque visual (ex.: saldo levantável) */
    highlight?: boolean;
    className?: string;
}

export function KpiCard({
    label,
    value,
    subtitle,
    icon: Icon,
    iconColor = "text-violet-600",
    highlight = false,
    className = "",
}: KpiCardProps) {
    return (
        <div
            className={[
                "dash-card flex flex-row sm:flex-col gap-3 sm:gap-5 p-4 sm:p-6 lg:p-8",
                "group hover:shadow-lg transition-all duration-300 min-w-0",
                highlight
                    ? "sm:col-span-1 ring-2 ring-violet-200 bg-gradient-to-br from-violet-50/80 to-white"
                    : "",
                className,
            ].join(" ")}
        >
            {Icon && (
                <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center border ${
                        highlight
                            ? "bg-violet-600 border-violet-500 text-white"
                            : `bg-violet-50 border-violet-100 ${iconColor}`
                    }`}
                >
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1.5 sm:mb-3 leading-snug">
                    {label}
                </p>
                <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight leading-none tabular-nums break-words">
                    {value}
                </p>
                {subtitle && (
                    <p className="mt-2 sm:mt-4 text-[11px] sm:text-[13px] font-medium text-neutral-500 leading-relaxed line-clamp-2 sm:line-clamp-none">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
