import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="dash-card">
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className="w-20 h-20 rounded-[28px] bg-violet-50 border border-violet-100 flex items-center justify-center mb-8">
                    <Icon className="w-8 h-8 text-violet-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 tracking-tight mb-2">{title}</h3>
                {description && (
                    <p className="text-sm text-neutral-500 max-w-[280px] leading-relaxed">{description}</p>
                )}
                {action && <div className="mt-8">{action}</div>}
            </div>
        </div>
    );
}
