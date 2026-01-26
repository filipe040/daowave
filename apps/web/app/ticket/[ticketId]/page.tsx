/**
 * Ticket Detail Page with QR Code
 */

import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';
import { generateQRCode } from '@/lib/qr/generate';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getTicket(ticketId: string, userId: string) {
  return await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          venue: true,
          city: true,
          startAt: true,
          endAt: true,
          coverImage: true,
        },
      },
      order: {
        select: {
          id: true,
          createdAt: true,
          totalCents: true,
          currency: true,
        },
      },
    },
  });
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Por favor, faça login para ver este bilhete.</p>
      </div>
    );
  }

  const { ticketId } = await params;
  const ticket = await getTicket(ticketId, session.user.id);

  if (!ticket || ticket.userId !== session.user.id) {
    notFound();
  }

  // Generate QR code
  const qrDataUrl = await generateQRCode({
    ticketId: ticket.id,
    code: ticket.code,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {ticket.event.coverImage && (
            <div className="relative h-64 w-full">
              <Image
                src={ticket.event.coverImage}
                alt={ticket.event.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">
                  {ticket.event.title}
                </h1>

                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Código do Bilhete</p>
                    <p className="font-mono text-lg font-semibold">{ticket.code}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Local</p>
                    <p className="font-semibold">{ticket.event.venue}</p>
                    <p className="text-slate-600">{ticket.event.city}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Data e Hora</p>
                    <p className="font-semibold">{formatDate(ticket.event.startAt)}</p>
                  </div>

                  {ticket.checkedInAt && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-semibold">
                        ✓ Bilhete utilizado em {formatDate(ticket.checkedInAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <h2 className="text-xl font-semibold mb-4">Código QR</h2>
                <div className="bg-white p-4 rounded-lg border-2 border-slate-200">
                  <Image
                    src={qrDataUrl}
                    alt="QR Code"
                    width={300}
                    height={300}
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Apresente este código QR na entrada do evento
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
