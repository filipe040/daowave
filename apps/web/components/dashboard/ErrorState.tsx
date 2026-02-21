import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorState({ message = "Ocorreu um erro inesperado.", onRetry }: ErrorStateProps) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-[32px] border border-red-500/20 shadow-2xl">
            <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
                <div className="w-20 h-20 rounded-[28px] bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-8">
                    <AlertCircle className="w-8 h-8 text-red-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-2">Algo correu mal</h3>
                <p className="text-sm text-red-400/60 max-w-[320px] leading-relaxed mb-8">{message}</p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[14px] font-bold bg-white text-black hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-white/5"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Tentar novamente
                    </button>
                )}
            </div>
        </div>
    );
}
