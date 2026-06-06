import { LucideIcon } from "lucide-react";

interface KpiCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
}

export function KpiCard({ label, value, subtitle, icon: Icon, iconColor = "text-violet-600" }: KpiCardProps) {
    return (
        <div className="dash-card p-6 sm:p-8 flex flex-col gap-5 sm:gap-6 group hover:shadow-lg transition-all duration-300">
            {Icon && (
                <div className={`w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
            )}
            <div>
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-3">
                    {label}
                </p>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tighter leading-none">
                    {value}
                </p>
                {subtitle && (
                    <div className="mt-4 text-[13px] font-medium text-neutral-500 leading-relaxed uppercase tracking-wider">{subtitle}</div>
                )}
            </div>
        </div>
    );
}
