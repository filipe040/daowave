import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckCircle } from "lucide-react";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen mesh-gradient pt-24 pb-16 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-lg relative z-10">
        <CheckoutStepper currentStep={3} />

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 sm:p-12 text-center backdrop-blur-2xl shadow-2xl" data-testid="page-order-success">
        <div className="mb-6 flex justify-center"><CheckCircle className="h-20 w-20 text-emerald-400" strokeWidth={1.5} /></div>
        <h1 className="mb-3 text-3xl sm:text-4xl font-bold text-white/92">Pagamento concluído!</h1>
        <p className="mb-8 text-lg text-white/60">
          Os teus bilhetes foram emitidos com sucesso e enviados para o teu email.
        </p>
        <div className="mx-auto mb-10 w-fit rounded-2xl border border-white/10 bg-white/5 px-8 py-5">
          <p className="text-xs font-medium text-white/40 uppercase tracking-[0.1em] mb-1">
            Bilhetes emitidos
          </p>
          <p className="text-4xl font-bold text-white/90">{order.tickets.length}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/my-tickets"
            className="rounded-full bg-white px-8 py-4 text-center text-[15px] font-bold text-black shadow-[0_8px_32px_rgba(255,255,255,.18)] transition-all hover:bg-white/90 hover:scale-[1.03] active:scale-[0.98]"
          >
            Ver os meus bilhetes
          </Link>
          <Link
            href={`/events/${order.event.slug}`}
            className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-center text-[15px] font-bold text-white/90 transition-all hover:border-white/30 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            Voltar ao evento
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
