import { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export interface Column<T> {
    key: keyof T | string;
    label: string;
    className?: string;
    render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyField: keyof T;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    emptyIcon?: LucideIcon;
    emptyTitle?: string;
    emptyDescription?: string;
    page?: number;
    totalPages?: number;
    total?: number;
    onPageChange?: (page: number) => void;
    /** Optional action slot rendered per row, far right column */
    rowActions?: (row: T) => ReactNode;
}

export function DataTable<T>({
    columns,
    data,
    keyField,
    loading,
    error,
    onRetry,
    emptyIcon = Inbox,
    emptyTitle = "Sem dados",
    emptyDescription,
    page = 1,
    totalPages = 1,
    total,
    onPageChange,
    rowActions,
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-[24px] border border-white/10 shadow-2xl overflow-hidden animate-pulse">
                <div className="px-8 py-5 border-b border-white/5 flex gap-8">
                    {columns.map((col) => (
                        <div key={String(col.key)} className="h-3 w-20 bg-white/10 rounded" />
                    ))}
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-8 py-6 border-b border-white/5 last:border-0 flex gap-8">
                        <div className="h-4 w-32 bg-white/10 rounded" />
                        <div className="h-4 w-24 bg-white/5 rounded" />
                        <div className="h-4 w-16 bg-white/5 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) return <ErrorState message={error} onRetry={onRetry} />;

    if (data.length === 0) {
        return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white/[0.03] backdrop-blur-xl rounded-[24px] border border-white/10 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                {columns.map((col) => (
                                    <th
                                        key={String(col.key)}
                                        className={`px-8 py-5 text-left text-[11px] font-bold text-white/40 uppercase tracking-[0.1em] whitespace-nowrap ${col.className ?? ""}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                                {rowActions && <th className="px-8 py-5 text-right text-[11px] font-bold text-white/40 uppercase tracking-[0.1em]">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.map((row) => (
                                <tr
                                    key={String(row[keyField])}
                                    className="hover:bg-white/[0.02] transition-all duration-200 group"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={String(col.key)}
                                            className={`px-8 py-6 text-white/80 font-medium ${col.className ?? ""}`}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String((row as Record<string, unknown>)[col.key as string] ?? "—")}
                                        </td>
                                    ))}
                                    {rowActions && (
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {rowActions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {onPageChange && (
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <p className="text-[13px] text-white/40">
                            Página <span className="text-white/80 font-bold">{page}</span> de <span className="text-white/80 font-bold">{totalPages}</span>
                            {total !== undefined && (
                                <span className="ml-2 font-normal text-white/20">| {total} resultados</span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => onPageChange(page - 1)}
                            className="bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 px-4 py-2 rounded-xl text-white transition-all active:scale-95 flex items-center gap-2 text-sm font-semibold"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => onPageChange(page + 1)}
                            className="bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed border border-white/5 px-4 py-2 rounded-xl text-white transition-all active:scale-95 flex items-center gap-2 text-sm font-semibold"
                        >
                            Próximo
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
