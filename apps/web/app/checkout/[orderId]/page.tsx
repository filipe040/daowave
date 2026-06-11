/**
 * Checkout Page
 */

import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { CheckoutForm } from './checkout-form';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export const dynamic = "force-dynamic";

async function getOrder(orderId: string) {
  return await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          venue: true,
          city: true,
          startAt: true,
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
      <div className="min-h-screen mesh-gradient flex items-center justify-center px-4 text-neutral-900">
        <div className="text-center max-w-md rounded-3xl border border-neutral-200 bg-white p-10 shadow-lg">
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">Sessão necessária</h1>
          <p className="text-neutral-600 mb-6">Inicie sessão para concluir a compra.</p>
          <Link
            href="/auth/signin?from=/events"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-violet-600 px-8 py-3 text-sm font-bold text-neutral-900 shadow-md"
          >
            Iniciar sessão
          </Link>
        </div>
      </div>
    );
  }

  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  if (order.status === 'PAID') {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center px-4 text-neutral-900">
        <div className="text-center max-w-md rounded-3xl border border-neutral-200 bg-white p-10 shadow-lg">
          <h1 className="text-2xl font-bold text-neutral-900 mb-3">Pedido já pago</h1>
          <p className="text-neutral-600 mb-6">Este pedido já foi processado com sucesso.</p>
          <Link href="/my-tickets" className="text-violet-600 hover:text-violet-700 font-bold">
            Ver os meus bilhetes →
          </Link>
        </div>
      </div>
    );
  }

  const subtotalCents = order.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0
  );
  const serviceFeeCents = order.serviceFeeCents ?? 0;
  const feePaidBy = order.feePaidBy ?? "BUYER";
  const displayTotalCents = order.totalCents;

  const ticketCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div data-testid="page-checkout" className="min-h-screen mesh-gradient text-neutral-900 pt-24 pb-16 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <Link
          href={`/events/${order.event.slug}`}
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-violet-600 text-sm mb-8 font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao evento
        </Link>

        <CheckoutStepper currentStep={2} />

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            Pagamento seguro
          </h1>
          <p className="text-neutral-600 mt-2 text-[15px]">
            {ticketCount} {ticketCount === 1 ? 'bilhete' : 'bilhetes'} · {order.event.title}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <div className="rounded-[28px] border border-neutral-200 bg-white overflow-hidden shadow-lg">
              {order.event.coverImage && (
                <div className="aspect-[16/9] relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.event.coverImage}
                    alt={order.event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              )}

              <div className="p-6 sm:p-7 space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">
                    Evento
                  </p>
                  <h2 className="font-bold text-neutral-900 text-xl leading-snug">{order.event.title}</h2>
                </div>

                <div className="space-y-2.5 text-sm text-neutral-600">
                  {order.event.startAt && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                      {format(new Date(order.event.startAt), "EEEE, d 'de' MMMM · HH:mm", { locale: pt })}
                    </p>
                  )}
                  {(order.event.venue || order.event.city) && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-violet-500 shrink-0" />
                      {[order.event.venue, order.event.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-5 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                    Bilhetes
                  </p>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-neutral-700">
                        {item.ticketLot.name}
                        <span className="text-neutral-400 ml-1">×{item.quantity}</span>
                      </span>
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        {formatCurrency(item.quantity * item.unitPriceCents)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neutral-200 pt-5 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Bilhete(s)</span>
                    <span className="font-semibold text-neutral-900 tabular-nums">
                      {formatCurrency(subtotalCents)}
                    </span>
                  </div>
                  {feePaidBy === "BUYER" && serviceFeeCents > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Taxa de Serviço LivePass</span>
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        {formatCurrency(serviceFeeCents)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-2 border-t border-neutral-100">
                    <span className="text-sm font-semibold text-neutral-500">Total</span>
                    <span className="text-3xl font-black text-violet-700 tabular-nums">
                      {formatCurrency(displayTotalCents)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-[12px] text-emerald-800 font-medium">
                    Compra protegida · Bilhetes digitais instantâneos
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6 sm:p-9 shadow-lg">
              <CheckoutForm
                orderId={orderId}
                subtotalCents={subtotalCents}
                serviceFeeCents={serviceFeeCents}
                totalCents={displayTotalCents}
                feePaidBy={feePaidBy}
                eventId={order.event.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
