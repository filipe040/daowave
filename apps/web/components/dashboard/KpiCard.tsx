import { LucideIcon } from "lucide-react";

interface KpiCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string;
}

export function KpiCard({ label, value, subtitle, icon: Icon, iconColor = "text-gray-400" }: KpiCardProps) {
    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
            {Icon && (
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
            )}
            <div>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2">
                    {label}
                </p>
                <p className="text-3xl font-bold text-white tracking-tight leading-none">
                    {value}
                </p>
                {subtitle && (
                    <p className="mt-2 text-[12px] text-white/30">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
