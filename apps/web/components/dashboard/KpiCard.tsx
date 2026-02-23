import { LucideIcon } from "lucide-react";

interface KpiCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
}

export function KpiCard({ label, value, subtitle, icon: Icon, iconColor = "text-white/40" }: KpiCardProps) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[28px] border border-white/10 p-6 sm:p-8 flex flex-col gap-5 sm:gap-6 shadow-2xl group hover:bg-white/[0.05] transition-all duration-300">
            {Icon && (
                <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center ${iconColor} shadow-inner`}>
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
            )}
            <div>
                <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3">
                    {label}
                </p>
                <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none">
                    {value}
                </p>
                {subtitle && (
                    <div className="mt-4 text-[13px] font-medium text-white/30 leading-relaxed group-hover:text-white/50 transition-colors uppercase tracking-wider">{subtitle}</div>
                )}
            </div>
        </div>
    );
}
