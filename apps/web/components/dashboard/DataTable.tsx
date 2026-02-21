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
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden animate-pulse">
                <div className="px-6 py-3.5 border-b border-gray-100 flex gap-6">
                    {columns.map((col) => (
                        <div key={String(col.key)} className="h-3 w-20 bg-gray-100 rounded" />
                    ))}
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 border-b border-gray-50 last:border-0 flex gap-6">
                        <div className="h-4 w-32 bg-gray-100 rounded" />
                        <div className="h-4 w-24 bg-gray-50 rounded" />
                        <div className="h-4 w-16 bg-gray-50 rounded" />
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
        <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                {columns.map((col) => (
                                    <th
                                        key={String(col.key)}
                                        className={`px-6 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap ${col.className ?? ""}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                                {rowActions && <th className="px-6 py-3.5" />}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.map((row) => (
                                <tr
                                    key={String(row[keyField])}
                                    className="hover:bg-gray-50/60 transition-colors"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={String(col.key)}
                                            className={`px-6 py-4 text-gray-700 ${col.className ?? ""}`}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String((row as Record<string, unknown>)[col.key as string] ?? "—")}
                                        </td>
                                    ))}
                                    {rowActions && (
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
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
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                        Página {page} de {totalPages}
                        {total !== undefined && ` · ${total} total`}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={page <= 1}
                            onClick={() => onPageChange(page - 1)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200/80 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => onPageChange(page + 1)}
                            className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200/80 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
