"use client";

import { useState, useMemo } from "react";
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export interface Column<T = any> {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    key: string;
    direction: "asc" | "desc";
  };
  onSort?: (key: string, direction: "asc" | "desc") => void;
  emptyMessage?: string;
  className?: string;
  rowKey?: string;
  onRowClick?: (row: T, index: number) => void;
  selectedRows?: string[];
  onRowSelect?: (rowKey: string, selected: boolean) => void;
  actions?: React.ReactNode;
}

export function DataTable<T = any>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  onSort,
  emptyMessage = "Nenhum dados encontrados",
  className = "",
  rowKey = "id",
  onRowClick,
  selectedRows = [],
  onRowSelect,
  actions
}: DataTableProps<T>) {
  const [localSorting, setLocalSorting] = useState<{ key: string; direction: "asc" | "desc" } | null>(
    sorting || null
  );

  const handleSort = (key: string) => {
    if (!columns.find(col => col.key === key)?.sortable) return;

    const currentDirection = localSorting?.key === key ? localSorting.direction : null;
    const newDirection: "asc" | "desc" = currentDirection === "asc" ? "desc" : "asc";

    const newSorting = { key, direction: newDirection };
    setLocalSorting(newSorting);

    if (onSort) {
      onSort(key, newDirection);
    }
  };

  const sortedData = useMemo(() => {
    if (!localSorting || onSort) return data; // If external sorting, return data as-is

    return [...data].sort((a: any, b: any) => {
      const aValue = a[localSorting.key];
      const bValue = b[localSorting.key];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return localSorting.direction === "asc" ? comparison : -comparison;
    });
  }, [data, localSorting, onSort]);

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="border-b border-gray-200">
          <div className="px-6 py-4 flex space-x-4">
            {columns.map((col, j) => (
              <div
                key={j}
                className="h-4 bg-gray-200 rounded"
                style={{ width: col.width || '100px' }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4v4L8 9l-1 4-2-2" />
        </svg>
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">Sem dados</h3>
      <p className="text-sm text-gray-500">{emptyMessage}</p>
    </div>
  );

  const Pagination = () => {
    if (!pagination) return null;

    const { page, pageSize, total, onPageChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, total);

    return (
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              A mostrar <span className="font-medium">{startItem}</span> a{" "}
              <span className="font-medium">{endItem}</span> de{" "}
              <span className="font-medium">{total}</span> resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="pagination-prev"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => onPageChange(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${pageNum === page
                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      }`}
                    data-testid={`pagination-page-${pageNum}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="pagination-next"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`} data-testid="data-table">
      {actions && (
        <div className="border-b border-gray-200 px-4 py-3 sm:px-6">
          {actions}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {onRowSelect && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={(e) => {
                      data.forEach((row: any) => {
                        const key = row[rowKey];
                        onRowSelect(key, e.target.checked);
                      });
                    }}
                    data-testid="select-all-checkbox"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? "cursor-pointer hover:bg-gray-100" : ""
                    } ${column.className || ""}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key)}
                  data-testid={`column-header-${column.key}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon
                          className={`h-3 w-3 ${localSorting?.key === column.key && localSorting?.direction === "asc"
                            ? "text-gray-900"
                            : "text-gray-300"
                            }`}
                        />
                        <ChevronDownIcon
                          className={`h-3 w-3 -mt-1 ${localSorting?.key === column.key && localSorting?.direction === "desc"
                            ? "text-gray-900"
                            : "text-gray-300"
                            }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (onRowSelect ? 1 : 0)} className="px-0 py-0">
                  <LoadingSkeleton />
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onRowSelect ? 1 : 0)} className="px-0 py-0">
                  <EmptyState />
                </td>
              </tr>
            ) : (
              sortedData.map((row: any, index) => {
                const key = row[rowKey];
                const isSelected = selectedRows.includes(key);

                return (
                  <tr
                    key={key}
                    className={`hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""
                      } ${isSelected ? "bg-blue-50" : ""}`}
                    onClick={() => onRowClick?.(row, index)}
                    data-testid={`table-row-${key}`}
                  >
                    {onRowSelect && (
                      <td className="px-6 py-4 whitespace-nowrap w-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onRowSelect(key, e.target.checked);
                          }}
                          data-testid={`row-checkbox-${key}`}
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ""}`}
                        data-testid={`cell-${key}-${column.key}`}
                      >
                        {column.render
                          ? column.render(row[column.key], row, index)
                          : row[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination />
    </div>
  );
}

// Common column renderers
export const ColumnRenderers = {
  date: (value: string | Date) => {
    if (!value) return "-";
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleDateString("pt-PT");
  },

  dateTime: (value: string | Date) => {
    if (!value) return "-";
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toLocaleString("pt-PT");
  },

  currency: (value: number, currency = "EUR") => {
    if (typeof value !== "number") return "-";
    return `${(value / 100).toFixed(2)}€`;
  },

  status: (value: string, colorMap?: Record<string, string>) => {
    const colors = colorMap || {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      DRAFT: "bg-gray-100 text-gray-800",
      PUBLISHED: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[value] || colors.INACTIVE
          }`}
      >
        {value}
      </span>
    );
  },

  boolean: (value: boolean, labels = { true: "Sim", false: "Não" }) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}
      >
        {value ? labels.true : labels.false}
      </span>
    );
  },

  avatar: (src?: string, name?: string) => (
    <div className="flex items-center">
      {src ? (
        <img className="h-8 w-8 rounded-full" src={src} alt={name || ""} />
      ) : (
        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">
            {name?.charAt(0).toUpperCase() || "?"}
          </span>
        </div>
      )}
      {name && <span className="ml-2 text-sm text-gray-900">{name}</span>}
    </div>
  ),

  actions: (actions: Array<{ label: string; onClick: () => void; variant?: "primary" | "secondary" | "danger" }>) => (
    <div className="flex space-x-2">
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
          className={`px-3 py-1 text-xs font-medium rounded-md ${action.variant === "primary"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : action.variant === "danger"
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          data-testid={`action-${action.label.toLowerCase()}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  ),
};
