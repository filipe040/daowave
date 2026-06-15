/**
 * Checkout Page
 */

import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { staffDashboardRedirectPath } from '@/lib/auth/public-nav';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';
import { CheckoutForm } from './checkout-form';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { BuyerFeeBreakdownLine } from '@/components/checkout/BuyerFeeBreakdownLine';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { getPaymentMethodsInfo } from '@/lib/payment/methods';

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
      <div className="min-h-screen public-shell flex items-center justify-center px-4">
        <div className="text-center max-w-md rounded-3xl border border-white/10 bg-[#14141f] p-10 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-3">Sessão necessária</h1>
          <p className="text-zinc-400 mb-6">Inicie sessão para concluir a compra.</p>
          <Link
            href="/auth/signin?from=/events"
            className="inline-flex items-center justify-center rounded-full bg-[#00a0e3] px-8 py-3 text-sm font-bold text-white shadow-lg"
          >
            Iniciar sessão
          </Link>
        </div>
      </div>
    );
  }

  const staffRedirect = staffDashboardRedirectPath(session);
  if (staffRedirect) redirect(staffRedirect);

  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order || order.userId !== session.user.id) {
    notFound();
  }

  if (order.status === 'PAID') {
    return (
      <div className="min-h-screen public-shell flex items-center justify-center px-4">
        <div className="text-center max-w-md rounded-3xl border border-white/10 bg-[#14141f] p-10 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-3">Pedido já pago</h1>
          <p className="text-zinc-400 mb-6">Este pedido já foi processado com sucesso.</p>
          <Link href="/my-tickets" className="text-[#5ec8f8] hover:text-[#00a0e3] font-bold">
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
  const ticketCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const serviceFeeCents = order.serviceFeeCents ?? 0;
  const feePaidBy = order.feePaidBy ?? "BUYER";
  const displayTotalCents = order.totalCents;
  const paymentInfo = getPaymentMethodsInfo();

  return (
    <div data-testid="page-checkout" className="public-shell min-h-screen pt-24 pb-16 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <Link
          href={`/events/${order.event.slug}`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#5ec8f8] text-sm mb-8 font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao evento
        </Link>

        <CheckoutStepper currentStep={2} />

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Pagamento seguro
          </h1>
          <p className="text-zinc-400 mt-2 text-[15px]">
            {ticketCount} {ticketCount === 1 ? 'bilhete' : 'bilhetes'} · {order.event.title}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <div className="rounded-[28px] border border-white/10 bg-[#14141f] overflow-hidden shadow-2xl">
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
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
                    Evento
                  </p>
                  <h2 className="font-bold text-white text-xl leading-snug">{order.event.title}</h2>
                </div>

                <div className="space-y-2.5 text-sm text-zinc-400">
                  {order.event.startAt && (
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#00a0e3] shrink-0" />
                      {format(new Date(order.event.startAt), "EEEE, d 'de' MMMM · HH:mm", { locale: pt })}
                    </p>
                  )}
                  {(order.event.venue || order.event.city) && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#00a0e3] shrink-0" />
                      {[order.event.venue, order.event.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                <div className="border-t border-white/10 pt-5 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    Bilhetes
                  </p>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-zinc-300">
                        {item.ticketLot.name}
                        <span className="text-zinc-500 ml-1">×{item.quantity}</span>
                      </span>
                      <span className="font-semibold text-white tabular-nums">
                        {formatCurrency(item.quantity * item.unitPriceCents)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-5">
                  <div className="flex justify-between items-end gap-4">
                    <div>
                      <span className="text-sm font-semibold text-zinc-500">Total</span>
                      <BuyerFeeBreakdownLine
                        ticketCount={ticketCount}
                        serviceFeeCents={serviceFeeCents}
                        feePaidBy={feePaidBy}
                        className="mt-1"
                      />
                    </div>
                    <span className="text-3xl font-black text-[#5ec8f8] tabular-nums">
                      {formatCurrency(displayTotalCents)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <p className="text-[12px] text-emerald-300 font-medium">
                    Compra protegida · Bilhetes digitais instantâneos
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-[28px] border border-white/10 bg-[#14141f] p-6 sm:p-9 shadow-2xl">
              <CheckoutForm
                orderId={orderId}
                subtotalCents={subtotalCents}
                serviceFeeCents={serviceFeeCents}
                totalCents={displayTotalCents}
                feePaidBy={feePaidBy}
                ticketCount={ticketCount}
                eventId={order.event.id}
                stripePaymentsEnabled={paymentInfo.stripeEnabled}
                mockPaymentsEnabled={paymentInfo.mockEnabled}
                availablePaymentMethods={paymentInfo.available}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
