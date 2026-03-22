/**
 * Checkout Page
 */

import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { CheckoutForm } from './checkout-form';

export const dynamic = "force-dynamic";

async function getOrder(orderId: string, userId: string) {
  return await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
        },
      },
      items: {
        include: {
          ticketLot: {
            select: {
              name: true,
              priceCents: true,
            },
          },
        },
      },
    },
  });
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Por favor, faça login para continuar.</p>
      </div>
    );
  }

  const { orderId } = await params;
  const order = await getOrder(orderId, session.user.id);

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  if (order.status === 'PAID') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Pedido já pago!</h1>
          <p className="text-slate-600 mb-4">
            Este pedido já foi processado com sucesso.
          </p>
          <a
            href="/my-tickets"
            className="text-blue-600 hover:underline"
          >
            Ver os meus bilhetes
          </a>
        </div>
      </div>
    );
  }

  const totalCents = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0
  );

  return (
    <div data-testid="page-checkout" className="min-h-screen bg-black pt-28 pb-12 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-0 -ml-32 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-2 tracking-tight uppercase">
          Finalizar Compra
        </h1>
        <p className="text-white/50 mb-10 text-[15px]">Falta muito pouco para garantir os seus bilhetes.</p>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[32px] border border-white/10 p-8 sm:p-10 shadow-2xl">
            <h2 className="text-[12px] font-bold text-white/50 uppercase tracking-[0.2em] mb-8">Resumo do Pedido</h2>

            <div className="mb-8">
              <h3 className="font-bold text-white text-xl sm:text-2xl tracking-tight leading-snug">
                {order.event.title}
              </h3>
            </div>

            <div className="space-y-4 mb-8">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm p-4 bg-white/5 rounded-2xl border border-white/5"
                >
                  <span className="text-white/80 font-medium">
                    {item.ticketLot.name} × {item.quantity}
                  </span>
                  <span className="font-bold text-white tracking-wide">
                    {formatCurrency(item.quantity * item.unitPriceCents)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-6">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.2em] block mb-1">Total a pagar</span>
                </div>
                <span className="text-4xl font-black text-white tracking-tight">
                  {formatCurrency(totalCents)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* decorative gradient inside the card */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <CheckoutForm orderId={orderId} totalCents={totalCents} eventId={order.event.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
