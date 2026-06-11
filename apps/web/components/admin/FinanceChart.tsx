"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinanceChartPoint } from "@/lib/finance/types";

const fmt = (cents: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(cents / 100);

export function FinanceChart({ data }: { data: FinanceChartPoint[] }) {
  const chartData = data.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }),
    gmv: p.gmvCents / 100,
    revenue: p.revenueCents / 100,
    profit: p.profitCents / 100,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
          <Tooltip
            formatter={(value: number, name: string) => [
              fmt(Math.round(value * 100)),
              name === "gmv" ? "GMV" : name === "revenue" ? "Receita" : "Lucro",
            ]}
          />
          <Area type="monotone" dataKey="gmv" stroke="#7c3aed" fill="url(#gmvGrad)" strokeWidth={2} />
          <Area type="monotone" dataKey="profit" stroke="#059669" fill="transparent" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
