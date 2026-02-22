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
        <h1 className="text-2xl sm:text-3xl font-semibold text-white/92 tracking-tight">
          Compras
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Histórico de encomendas e pagamentos.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-white/55">A carregar…</p>
      ) : error ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/55">Ainda não tens compras.</div>
      ) : (
        <ul className="space-y-4" data-testid="account-orders-list">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_18px_60px_rgba(0,0,0,.45)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-white/92 text-[18px]">{order.event?.title ?? "Evento"}</p>
                  <p className="mt-1 text-sm text-white/55">
                    {formatDate(order.createdAt)} <span className="mx-1.5 opacity-40">•</span> <span className={order.status === "CONFIRMED" ? "text-emerald-400" : "text-white/55"}>{order.status}</span>
                  </p>
                </div>
                <p className="text-xl font-bold text-white/92 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                  {formatCurrency(order.totalCents, order.currency)}
                </p>
              </div>
              <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-2">
                {order.items?.map((item: { ticketLot: { name: string }; quantity: number }, i: number) => (
                  <span
                    key={i}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-white/70"
                  >
                    {item.quantity}× {item.ticketLot?.name ?? "Bilhete"}
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
