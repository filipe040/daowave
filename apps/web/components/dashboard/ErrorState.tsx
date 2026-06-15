import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorState({ message = "Ocorreu um erro inesperado.", onRetry }: ErrorStateProps) {
    return (
        <div className="rounded-[32px] border border-red-200 bg-red-50 shadow-md">
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className="w-20 h-20 rounded-[28px] bg-red-100 border border-red-200 flex items-center justify-center mb-8">
                    <AlertCircle className="w-8 h-8 text-red-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-2">Algo correu mal</h3>
                <p className="text-sm text-red-600 max-w-[320px] leading-relaxed mb-8">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="dash-btn-primary"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Tentar novamente
                    </button>
                )}
            </div>
        </div>
    );
}
