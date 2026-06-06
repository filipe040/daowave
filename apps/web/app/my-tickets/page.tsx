/**
 * My Tickets Page
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Ticket, ArrowRight, MapPin, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

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
    orderBy: { createdAt: "desc" },
  });
}

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-lg">
          <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">Sessão</div>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">Acesso necessário</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Faz login para veres e gerires os teus bilhetes.
          </p>
          <Link
            href="/auth/signin"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-3 text-[13px] font-bold text-white shadow-md shadow-violet-500/25 transition hover:opacity-95"
          >
            Entrar
          </Link>
        </div>
      </div>
    );
  }

  const tickets = await getTickets(session.user.id);

  return (
    <div className="min-h-screen mesh-gradient text-neutral-900" data-testid="page-my-tickets">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="mb-8 sm:mb-10">
          <div className="text-[11px] uppercase tracking-wider text-violet-600 font-bold">Conta</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-black text-neutral-900">
            Os meus bilhetes
          </h1>
          <p className="mt-2 text-sm sm:text-[15px] text-neutral-600 max-w-2xl">
            Acede rapidamente aos teus bilhetes. Abre um bilhete para ver o QR e detalhes do evento.
          </p>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200 bg-white p-10 sm:p-14 text-center shadow-md">
            <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Ticket className="h-7 w-7 text-violet-500" strokeWidth={1.5} />
            </div>
            <p className="text-neutral-700 text-[15px] sm:text-[16px] font-semibold">
              Ainda não tens bilhetes comprados.
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Explora eventos disponíveis e compra o teu primeiro bilhete.
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-6 py-3 text-[13px] font-bold text-white shadow-md shadow-violet-500/25 transition hover:opacity-95"
            >
              Explorar eventos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tickets.map((ticket) => {
              const used = Boolean(ticket.checkedInAt);

              return (
                <Link
                  key={ticket.id}
                  href={`/ticket/${ticket.id}`}
                  className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-md transition-all duration-200 hover:border-violet-200 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  {ticket.event.coverImage ? (
                    <div className="relative h-44 w-full">
                      <Image
                        src={ticket.event.coverImage}
                        alt={ticket.event.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute left-4 top-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                            used
                              ? "bg-emerald-500 text-white"
                              : "bg-white/95 text-neutral-800 shadow-sm"
                          }`}
                        >
                          {used ? "Utilizado" : "Ativo"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-16 w-full bg-gradient-to-r from-violet-50 to-fuchsia-50 border-b border-neutral-100">
                      <div className="absolute left-4 top-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                            used
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-violet-100 text-violet-800 border border-violet-200"
                          }`}
                        >
                          {used ? "Utilizado" : "Ativo"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="relative p-5 sm:p-6">
                    <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                      {ticket.event.city || "—"}
                    </div>

                    <h2 className="mt-2 text-[18px] sm:text-[20px] font-bold text-neutral-900 leading-snug line-clamp-2">
                      {ticket.event.title}
                    </h2>

                    <div className="mt-4 space-y-2.5 text-[13px] text-neutral-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-violet-500 shrink-0" />
                        <span className="truncate font-medium">{ticket.event.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-violet-500 shrink-0" />
                        <span className="font-medium">{formatDate(ticket.event.startAt)}</span>
                      </div>
                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                        <span className="text-neutral-500 uppercase tracking-wider text-[11px] font-semibold">Código</span>
                        <span className="font-mono text-[12px] font-bold text-neutral-800">
                          {ticket.code}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold text-violet-600 group-hover:translate-x-1 transition-transform">
                      Abrir bilhete <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
