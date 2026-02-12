"use client";

import { LucideIcon } from "lucide-react";

export interface KpiCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "orange" | "red" | "gray";
  href?: string;
}

interface KpiGridProps {
  cards: KpiCard[];
  columns?: 2 | 3 | 4 | 6;
  loading?: boolean;
  className?: string;
}

const colorClasses = {
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  green: "bg-green-50 text-green-600 border-green-200",
  purple: "bg-purple-50 text-purple-600 border-purple-200",
  orange: "bg-orange-50 text-orange-600 border-orange-200",
  red: "bg-red-50 text-red-600 border-red-200",
  gray: "bg-gray-50 text-gray-600 border-gray-200",
};

const trendColors = {
  up: "text-green-600",
  down: "text-red-600",
  neutral: "text-gray-500",
};

const trendSymbols = {
  up: "↗",
  down: "↘",
  neutral: "→",
};

export function KpiGrid({
  cards,
  columns = 4,
  loading = false,
  className = ""
}: KpiGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  };

  if (loading) {
    return (
      <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
        {Array.from({ length: columns }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`} data-testid="kpi-grid">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const color = card.color || "gray";

        const CardContent = () => (
          <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">
                  {card.title}
                </p>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </p>
                  {card.trend && (
                    <span className={`ml-2 text-sm font-medium ${trendColors[card.trend.direction]}`}>
                      {trendSymbols[card.trend.direction]} {Math.abs(card.trend.value)}%
                    </span>
                  )}
                </div>
                {card.subtitle && (
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${colorClasses[color]}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>
          </div>
        );

        if (card.href) {
          return (
            <a
              key={card.id}
              href={card.href}
              className="block transition-transform hover:scale-[1.02]"
              data-testid={`kpi-card-${card.id}`}
            >
              <CardContent />
            </a>
          );
        }

        return (
          <div
            key={card.id}
            data-testid={`kpi-card-${card.id}`}
          >
            <CardContent />
          </div>
        );
      })}
    </div>
  );
}

// Preset KPI configurations
export const KpiPresets = {
  events: (value: number, active?: number) => ({
    id: "events",
    title: "Eventos",
    value,
    subtitle: active ? `${active} ativos` : undefined,
    icon: require("lucide-react").Calendar,
    color: "blue" as const,
  }),

  tickets: (sold: number, total?: number) => ({
    id: "tickets",
    title: "Bilhetes Vendidos",
    value: sold,
    subtitle: total ? `de ${total} disponíveis` : undefined,
    icon: require("lucide-react").Ticket,
    color: "green" as const,
  }),

  revenue: (amount: number, currency = "EUR") => ({
    id: "revenue",
    title: "Receita",
    value: `${(amount / 100).toFixed(2)}€`,
    icon: require("lucide-react").Euro,
    color: "purple" as const,
  }),

  orders: (count: number, trend?: { value: number; direction: "up" | "down" | "neutral" }) => ({
    id: "orders",
    title: "Pedidos",
    value: count,
    trend,
    icon: require("lucide-react").ShoppingBag,
    color: "orange" as const,
  }),

  users: (count: number) => ({
    id: "users",
    title: "Utilizadores",
    value: count,
    icon: require("lucide-react").Users,
    color: "gray" as const,
  }),

  checkins: (count: number, total?: number) => ({
    id: "checkins",
    title: "Check-ins",
    value: count,
    subtitle: total ? `de ${total} bilhetes` : undefined,
    icon: require("lucide-react").CheckCircle,
    color: "green" as const,
  }),
};
