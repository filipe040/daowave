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
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Resumo da conta
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Visão geral das tuas compras e bilhetes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2" data-testid="account-dashboard-cards">
        <Link
          href="/account/orders"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:bg-zinc-800/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          data-testid="card-orders"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Compras</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{ordersCount}</p>
            </div>
            <ShoppingBag className="h-10 w-10 text-zinc-500" />
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
            Ver histórico
            <ArrowRight className="h-4 w-4" />
          </p>
        </Link>

        <Link
          href="/account/tickets"
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:bg-zinc-800/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          data-testid="card-tickets"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bilhetes</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{ticketsCount}</p>
            </div>
            <Ticket className="h-10 w-10 text-zinc-500" />
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
            Ver bilhetes
            <ArrowRight className="h-4 w-4" />
          </p>
        </Link>
      </div>
    </div>
  );
}
