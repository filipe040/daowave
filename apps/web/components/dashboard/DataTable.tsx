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
    hideOnMobile?: boolean;
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
    mobileCard?: (row: T) => ReactNode;
}

const cellPad = "px-4 sm:px-6 lg:px-8";

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
    mobileCard,
}: DataTableProps<T>) {
    if (loading) {
        return (
            <div className="space-y-6">
                {mobileCard && (
                    <div className="md:hidden space-y-3 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="dash-card p-4 space-y-3">
                                <div className="h-4 w-3/4 bg-white/10 rounded" />
                                <div className="h-3 w-1/2 bg-white/5 rounded" />
                                <div className="flex gap-2">
                                    <div className="h-6 w-16 bg-white/5 rounded-full" />
                                    <div className="h-6 w-16 bg-white/5 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className={`dash-card overflow-hidden animate-pulse ${mobileCard ? "hidden md:block" : ""}`}>
                    <div className={`${cellPad} py-4 border-b border-white/10 flex gap-6`}>
                        {columns.map((col) => (
                            <div key={String(col.key)} className="h-3 w-20 bg-white/10 rounded" />
                        ))}
                    </div>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`${cellPad} py-5 border-b border-white/10 last:border-0 flex gap-6`}>
                            <div className="h-4 w-32 bg-white/10 rounded" />
                            <div className="h-4 w-24 bg-white/5 rounded" />
                            <div className="h-4 w-16 bg-white/5 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) return <ErrorState message={error} onRetry={onRetry} />;

    if (data.length === 0) {
        return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {mobileCard && (
                <div className="md:hidden space-y-3">
                    {data.map((row) => (
                        <div
                            key={String(row[keyField])}
                            className="dash-card p-4 sm:p-5 hover:shadow-lg transition-shadow"
                        >
                            {mobileCard(row)}
                        </div>
                    ))}
                </div>
            )}

            <div className={`dash-card overflow-hidden ${mobileCard ? "hidden md:block" : ""}`}>
                <div className="overflow-x-auto -mx-px">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                {columns.map((col) => (
                                    <th
                                        key={String(col.key)}
                                        className={`${cellPad} py-4 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] whitespace-nowrap ${col.className ?? ""}`}
                                    >
                                        {col.label}
                                    </th>
                                ))}
                                {rowActions && (
                                    <th className={`${cellPad} py-4 text-right text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em]`}>
                                        Ações
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {data.map((row) => (
                                <tr
                                    key={String(row[keyField])}
                                    className="hover:bg-[#00a0e3]/10 transition-all duration-200 group"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={String(col.key)}
                                            className={`${cellPad} py-5 text-zinc-200 font-medium ${col.className ?? ""}`}
                                        >
                                            {col.render
                                                ? col.render(row)
                                                : String((row as Record<string, unknown>)[col.key as string] ?? "—")}
                                        </td>
                                    ))}
                                    {rowActions && (
                                        <td className={`${cellPad} py-5`}>
                                            <div className="flex items-center justify-end gap-2 sm:gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
                    <p className="text-[12px] sm:text-[13px] text-zinc-500 text-center sm:text-left">
                        Página <span className="text-white font-bold">{page}</span> de{" "}
                        <span className="text-white font-bold">{totalPages}</span>
                        {total !== undefined && (
                            <span className="block sm:inline sm:ml-2 font-normal text-zinc-500">
                                {total} resultado{total !== 1 ? "s" : ""}
                            </span>
                        )}
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            disabled={page <= 1}
                            onClick={() => onPageChange(page - 1)}
                            className="dash-btn-secondary flex-1 sm:flex-none disabled:opacity-40 disabled:cursor-not-allowed text-[13px] py-2.5"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Anterior
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => onPageChange(page + 1)}
                            className="dash-btn-secondary flex-1 sm:flex-none disabled:opacity-40 disabled:cursor-not-allowed text-[13px] py-2.5"
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
