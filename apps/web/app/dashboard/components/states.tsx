"use client";

import { LucideIcon } from "lucide-react";
import { AlertCircleIcon, SearchIcon, PlusIcon, RefreshCwIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = SearchIcon,
  title,
  description,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`} data-testid="empty-state">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            action.variant === "primary"
              ? "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              : "text-blue-700 bg-blue-100 hover:bg-blue-200 focus:ring-blue-500"
          }`}
          data-testid="empty-state-action"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          {action.label}
        </button>
      )}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function ErrorState({
  title = "Erro ao carregar",
  description = "Ocorreu um erro ao carregar os dados. Tente novamente.",
  action,
  className = ""
}: ErrorStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`} data-testid="error-state">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <AlertCircleIcon className="h-6 w-6 text-red-500" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          data-testid="error-state-action"
        >
          <RefreshCwIcon className="h-4 w-4 mr-2" />
          {action.label}
        </button>
      )}
    </div>
  );
}

export interface LoadingSkeletonProps {
  type?: "table" | "cards" | "list" | "details";
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({
  type = "table",
  rows = 5,
  className = ""
}: LoadingSkeletonProps) {
  if (type === "table") {
    return (
      <div className={`animate-pulse ${className}`} data-testid="loading-skeleton-table">
        {/* Table Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex space-x-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-20"></div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="border-b border-gray-200 px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: 4 }, (_, j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-200 rounded"
                  style={{ width: j === 0 ? '120px' : j === 1 ? '80px' : j === 2 ? '100px' : '60px' }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`} data-testid="loading-skeleton-cards">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={`space-y-3 ${className}`} data-testid="loading-skeleton-list">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "details") {
    return (
      <div className={`animate-pulse space-y-6 ${className}`} data-testid="loading-skeleton-details">
        {/* Header */}
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>

        {/* Content Sections */}
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`animate-pulse space-y-4 ${className}`} data-testid="loading-skeleton-default">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
      ))}
    </div>
  );
}

// Preset configurations
export const StatePresets = {
  noEvents: {
    title: "Nenhum evento",
    description: "Ainda não criaste nenhum evento. Cria o teu primeiro evento para começar.",
    action: {
      label: "Criar Evento",
      variant: "primary" as const,
    },
  },

  noUsers: {
    title: "Nenhum utilizador",
    description: "Não foram encontrados utilizadores com os filtros aplicados.",
  },

  noOrders: {
    title: "Nenhum pedido",
    description: "Não foram encontrados pedidos neste período.",
  },

  noResults: {
    title: "Nenhum resultado",
    description: "Não foram encontrados resultados para a sua pesquisa. Tente ajustar os filtros.",
  },

  noData: {
    title: "Sem dados",
    description: "Ainda não há dados disponíveis para mostrar.",
  },

  networkError: {
    title: "Erro de conexão",
    description: "Não foi possível carregar os dados. Verifique a sua ligação à internet.",
    action: {
      label: "Tentar novamente",
    },
  },

  serverError: {
    title: "Erro do servidor",
    description: "Ocorreu um erro no servidor. Tente novamente mais tarde.",
    action: {
      label: "Recarregar",
    },
  },

  unauthorized: {
    title: "Acesso negado",
    description: "Não tem permissões para aceder a esta informação.",
  },
};
