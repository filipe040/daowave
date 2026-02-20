import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorState({ message = "Ocorreu um erro inesperado.", onRetry }: ErrorStateProps) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                    <AlertCircle className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">Algo correu mal</h3>
                <p className="text-sm text-gray-400 max-w-xs">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Tentar novamente
                    </button>
                )}
            </div>
        </div>
    );
}
