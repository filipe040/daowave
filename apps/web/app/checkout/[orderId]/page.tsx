/**
 * Checkout Page
 */

import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { CheckoutForm } from './checkout-form';

export const dynamic = 'force-dynamic';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Finalizar Compra
        </h1>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Resumo do Pedido</h2>
            
            <div className="mb-4">
              <h3 className="font-semibold text-slate-900 mb-2">
                {order.event.title}
              </h3>
            </div>

            <div className="space-y-2 mb-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {item.ticketLot.name} × {item.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.quantity * item.unitPriceCents)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalCents)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <CheckoutForm orderId={orderId} totalCents={totalCents} />
          </div>
        </div>
      </div>
    </div>
  );
}
