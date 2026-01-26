/**
 * My Tickets Page
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

async function getTickets(userId: string) {
  return await prisma.ticket.findMany({
    where: { userId },
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
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Por favor, faça login para ver os seus bilhetes.</p>
          <Link href="/promotor/login" className="text-blue-600 hover:underline">
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  const tickets = await getTickets(session.user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Os Meus Bilhetes
        </h1>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-slate-500 text-lg mb-4">
              Ainda não tem bilhetes comprados.
            </p>
            <Link
              href="/home"
              className="text-blue-600 hover:underline font-semibold"
            >
              Explorar Eventos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/ticket/${ticket.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
              >
                {ticket.event.coverImage && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={ticket.event.coverImage}
                      alt={ticket.event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">
                    {ticket.event.title}
                  </h2>
                  <div className="space-y-2 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{ticket.event.venue}, {ticket.event.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>{formatDate(ticket.event.startAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <span className="text-sm text-slate-500">Código</span>
                    <span className="font-mono text-sm font-semibold">
                      {ticket.code}
                    </span>
                  </div>
                  {ticket.checkedInAt && (
                    <div className="mt-2 text-sm text-green-600 font-semibold">
                      ✓ Utilizado
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
