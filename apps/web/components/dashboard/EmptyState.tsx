import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
                {description && (
                    <p className="text-sm text-gray-400 max-w-xs">{description}</p>
                )}
                {action && <div className="mt-5">{action}</div>}
            </div>
        </div>
    );
}
