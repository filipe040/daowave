import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-[32px] border border-white/10 shadow-2xl">
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className="w-20 h-20 rounded-[28px] bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-inner">
                    <Icon className="w-8 h-8 text-white/40" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-2">{title}</h3>
                {description && (
                    <p className="text-sm text-white/40 max-w-[280px] leading-relaxed">{description}</p>
                )}
                {action && <div className="mt-8">{action}</div>}
            </div>
        </div>
    );
}
