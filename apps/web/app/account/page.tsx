import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ShoppingBag, Ticket, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

async function getCounts(userId: string) {
  try {
    const [ordersCount, ticketsCount] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.ticket.count({ where: { userId } }),
    ]);
    return { ordersCount, ticketsCount };
  } catch {
    return { ordersCount: 0, ticketsCount: 0 };
  }
}

export default async function AccountDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const { ordersCount, ticketsCount } = await getCounts(session.user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white/92 tracking-tight">
          Resumo da conta
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Visão geral das tuas compras e bilhetes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-4" data-testid="account-dashboard-cards">
        <Link
          href="/account/orders"
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition-all duration-200 hover:bg-white/6 hover:border-white/16 shadow-[0_18px_60px_rgba(0,0,0,.45)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
          data-testid="card-orders"
        >
          {/* subtle hover highlight */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/6 blur-3xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/45">Compras</p>
              <p className="mt-2 text-3xl sm:text-4xl font-semibold text-white/92">{ordersCount}</p>
            </div>
            <ShoppingBag className="h-10 w-10 text-white/20 group-hover:text-white/40 transition-colors" />
          </div>
          <p className="relative mt-6 flex items-center gap-2 text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">
            Ver histórico
            <ArrowRight className="h-4 w-4" />
          </p>
        </Link>

        <Link
          href="/account/tickets"
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl transition-all duration-200 hover:bg-white/6 hover:border-white/16 shadow-[0_18px_60px_rgba(0,0,0,.45)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:outline-none"
          data-testid="card-tickets"
        >
          {/* subtle hover highlight */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/6 blur-3xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/45">Bilhetes</p>
              <p className="mt-2 text-3xl sm:text-4xl font-semibold text-white/92">{ticketsCount}</p>
            </div>
            <Ticket className="h-10 w-10 text-white/20 group-hover:text-white/40 transition-colors" />
          </div>
          <p className="relative mt-6 flex items-center gap-2 text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">
            Ver bilhetes
            <ArrowRight className="h-4 w-4" />
          </p>
        </Link>
      </div>
    </div>
  );
}
