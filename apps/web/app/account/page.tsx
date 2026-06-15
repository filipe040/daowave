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
        <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
          Resumo da conta
        </h1>
        <p className="mt-2 text-base text-zinc-400">
          Visão geral das tuas compras e bilhetes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-4" data-testid="account-dashboard-cards">
        <Link
          href="/account/orders"
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#14141f] p-6 shadow-md transition-all duration-200 hover:bg-white/10 hover:border-[#00a0e3]/30 shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#00a0e3]/30 focus-visible:outline-none"
          data-testid="card-orders"
        >
          {/* subtle hover highlight */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#00a0e3]/10 blur-3xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">Compras</p>
              <p className="mt-2 text-4xl sm:text-5xl font-black text-white">{ordersCount}</p>
            </div>
            <ShoppingBag className="h-10 w-10 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
          </div>
          <p className="relative mt-6 flex items-center gap-2 text-[14px] font-bold text-zinc-300 group-hover:text-white transition-colors">
            Ver histórico
            <ArrowRight className="h-4 w-4" />
          </p>
        </Link>

        <Link
          href="/account/tickets"
          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#14141f] p-6 shadow-md transition-all duration-200 hover:bg-white/10 hover:border-[#00a0e3]/30 shadow-md active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#00a0e3]/30 focus-visible:outline-none"
          data-testid="card-tickets"
        >
          {/* subtle hover highlight */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#00a0e3]/10 blur-3xl" />
          </div>

          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-zinc-400">Bilhetes</p>
              <p className="mt-2 text-4xl sm:text-5xl font-black text-white">{ticketsCount}</p>
            </div>
            <Ticket className="h-10 w-10 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
          </div>
          <p className="relative mt-6 flex items-center gap-2 text-[14px] font-bold text-zinc-300 group-hover:text-white transition-colors">
            Ver bilhetes
            <ArrowRight className="h-4 w-4" />
          </p>
        </Link>
      </div>
    </div>
  );
}
