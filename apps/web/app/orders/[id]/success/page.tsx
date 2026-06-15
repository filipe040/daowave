import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckCircle } from "lucide-react";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { PublicButton } from "@/components/public/public-page";

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
    <div className="public-shell min-h-screen pt-20 sm:pt-24 pb-16 px-4">
      <div className="mx-auto max-w-lg">
        <CheckoutStepper currentStep={3} />

        <div
          className="rounded-3xl border border-white/10 bg-[#14141f] p-8 sm:p-12 text-center shadow-2xl"
          data-testid="page-order-success"
        >
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 sm:h-20 sm:w-20 text-emerald-400" strokeWidth={1.5} />
          </div>
          <h1 className="mb-3 text-2xl sm:text-3xl font-black text-white">Pagamento concluído!</h1>
          <p className="mb-8 text-sm sm:text-base text-zinc-400">
            Os teus bilhetes foram emitidos e enviados para o teu email.
          </p>
          <div className="mx-auto mb-10 w-fit rounded-2xl border border-white/10 bg-[#0c0c12] px-8 py-5">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
              Bilhetes emitidos
            </p>
            <p className="text-4xl font-black text-white tabular-nums">{order.tickets.length}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <PublicButton href="/my-tickets">Ver os meus bilhetes</PublicButton>
            <PublicButton href={`/events/${order.event.slug}`} variant="secondary">
              Voltar ao evento
            </PublicButton>
          </div>
        </div>
      </div>
    </div>
  );
}
