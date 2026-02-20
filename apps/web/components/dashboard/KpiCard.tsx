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
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 flex flex-col gap-4">
            {Icon && (
                <div className={`w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-4.5 h-4.5" strokeWidth={1.75} />
                </div>
            )}
            <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">
                    {label}
                </p>
                <p className="text-3xl font-semibold text-gray-900 tracking-tight leading-none">
                    {value}
                </p>
                {subtitle && (
                    <p className="mt-1.5 text-xs text-gray-400">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
