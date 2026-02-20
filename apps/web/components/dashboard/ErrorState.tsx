"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorState({
    message = "Ocorreu um erro ao carregar os dados.",
    onRetry,
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <AlertTriangle className="h-10 w-10 text-destructive" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
            {onRetry && (
                <Button variant="outline" onClick={onRetry}>
                    Tentar novamente
                </Button>
            )}
        </div>
    );
}
