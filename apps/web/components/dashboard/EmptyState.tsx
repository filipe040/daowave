import { type LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({
    icon: Icon = Inbox,
    title = "Sem resultados",
    description = "Ainda não existem dados aqui.",
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icon className="h-12 w-12 text-muted-foreground/40 mb-4" strokeWidth={1} />
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
