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
        <h1 className="text-2xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
          Resumo da conta
        </h1>
        <p className="mt-2 text-base text-neutral-600">
          Visão geral das tuas compras e bilhetes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-4" data-testid="account-dashboard-cards">
        <Link
          href="/account/orders"
          className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-md transition-all duration-200 hover:bg-neutral-100 hover:border-neutral-300 shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:outline-none"
          data-testid="card-orders"
        >
          {/* subtle hover highlight */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-neutral-100 blur-3xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-neutral-600">Compras</p>
              <p className="mt-2 text-4xl sm:text-5xl font-black text-neutral-900">{ordersCount}</p>
            </div>
            <ShoppingBag className="h-10 w-10 text-neutral-500 group-hover:text-neutral-600 transition-colors" />
          </div>
          <p className="relative mt-6 flex items-center gap-2 text-[14px] font-bold text-neutral-700 group-hover:text-neutral-900 transition-colors">
            Ver histórico
            <ArrowRight className="h-4 w-4" />
          </p>
        </Link>

        <Link
          href="/account/tickets"
          className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-md transition-all duration-200 hover:bg-neutral-100 hover:border-neutral-300 shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-violet-200 focus-visible:outline-none"
          data-testid="card-tickets"
        >
          {/* subtle hover highlight */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-neutral-100 blur-3xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-neutral-600">Bilhetes</p>
              <p className="mt-2 text-4xl sm:text-5xl font-black text-neutral-900">{ticketsCount}</p>
            </div>
            <Ticket className="h-10 w-10 text-neutral-500 group-hover:text-neutral-600 transition-colors" />
          </div>
          <p className="relative mt-6 flex items-center gap-2 text-[14px] font-bold text-neutral-700 group-hover:text-neutral-900 transition-colors">
            Ver bilhetes
            <ArrowRight className="h-4 w-4" />
          </p>
        </Link>
      </div>
    </div>
  );
}
