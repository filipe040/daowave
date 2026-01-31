"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderItem {
  id: string;
  totalCents: number;
  currency: string;
  status: string;
  createdAt: string;
  event: { id: string; title: string; slug: string; startAt: string };
  items: Array<{
    ticketLot: { name: string; priceCents: number; currency: string };
    quantity: number;
  }>;
}

export default function AccountOrders() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
        else setError(data.error ?? "Erro ao carregar");
      })
      .catch(() => setError("Erro ao carregar encomendas"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Compras
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Histórico de encomendas e pagamentos.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ainda não tens compras.</p>
      ) : (
        <ul className="space-y-4" data-testid="account-orders-list">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{order.event?.title ?? "Evento"}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)} · {order.status}
                  </p>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(order.totalCents, order.currency)}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {order.items?.map((item: { ticketLot: { name: string }; quantity: number }, i: number) => (
                  <span
                    key={i}
                    className="rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {item.ticketLot?.name ?? "Bilhete"} × {item.quantity}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
