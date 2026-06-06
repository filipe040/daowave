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
            <div className="dash-card overflow-hidden animate-pulse">
                <div className="px-8 py-5 border-b border-neutral-100 flex gap-8">
                    {columns.map((col) => (
                        <div key={String(col.key)} className="h-3 w-20 bg-neutral-200 rounded" />
                    ))}
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-8 py-6 border-b border-neutral-100 last:border-0 flex gap-8">
                        <div className="h-4 w-32 bg-neutral-200 rounded" />
                        <div className="h-4 w-24 bg-neutral-100 rounded" />
                        <div className="h-4 w-16 bg-neutral-100 rounded" />
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
            <div className="dash-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100 bg-neutral-50/80">
                                {columns.map((col) => (
                                    <th
                                        key={String(col.key)}
                                        className={`px-8 py-5 text-left text-[11px] font-bold text-neutral-500 uppercase tracking-[0.1em] whitespace-nowrap ${col.className ?? ""}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                                {rowActions && <th className="px-8 py-5 text-right text-[11px] font-bold text-neutral-500 uppercase tracking-[0.1em]">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {data.map((row) => (
                                <tr
                                    key={String(row[keyField])}
                                    className="hover:bg-violet-50/40 transition-all duration-200 group"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={String(col.key)}
                                            className={`px-8 py-6 text-neutral-800 font-medium ${col.className ?? ""}`}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String((row as Record<string, unknown>)[col.key as string] ?? "—")}
                                        </td>
                                    ))}
                                    {rowActions && (
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
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

            {onPageChange && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-[13px] text-neutral-500">
                        Página <span className="text-neutral-900 font-bold">{page}</span> de <span className="text-neutral-900 font-bold">{totalPages}</span>
                        {total !== undefined && (
                            <span className="ml-2 font-normal text-neutral-400">| {total} resultados</span>
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => onPageChange(page - 1)}
                            className="dash-btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => onPageChange(page + 1)}
                            className="dash-btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
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
