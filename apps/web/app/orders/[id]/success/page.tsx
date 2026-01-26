import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getOrder(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      tickets: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!order || order.userId !== userId) {
    return null;
  }

  return order;
}

export default async function OrderSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return notFound();
  }

  const { id } = await params;
  const order = await getOrder(id, session.user.id);
  if (!order) {
    return notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-0 animate-fade-in">
      <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-500/5 p-8 sm:p-12 text-center backdrop-blur-sm">
        <div className="mb-6 text-6xl animate-pulse-slow">✓</div>
        <h1 className="mb-3 text-3xl sm:text-4xl font-bold">Pagamento concluído!</h1>
        <p className="mb-8 text-lg text-zinc-300">
          Os seus bilhetes foram emitidos com sucesso e enviados para o seu email.
        </p>
        <div className="mx-auto mb-8 w-fit rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-4">
          <p className="text-sm font-medium text-green-400 uppercase tracking-wide mb-1">
            Bilhetes emitidos
          </p>
          <p className="text-4xl font-bold text-green-400">{order.tickets.length}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/my-tickets"
          className="rounded-xl bg-white px-6 py-3 text-center text-sm font-bold text-zinc-950 transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/20 active:scale-95"
        >
          Ver os meus bilhetes
        </Link>
        <Link
          href={`/events/${order.event.slug}`}
          className="rounded-xl border-2 border-zinc-700 bg-zinc-900/50 px-6 py-3 text-center text-sm font-bold transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:scale-105 active:scale-95"
        >
          Voltar ao evento
        </Link>
      </div>
    </div>
  );
}
