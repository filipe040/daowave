/**
 * My Tickets Page — redesigned (high contrast)
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

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
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,.55)]">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Sessão</div>
          <h1 className="mt-2 text-2xl font-semibold text-white/90">Acesso necessário</h1>
          <p className="mt-2 text-sm text-white/60">
            Faz login para veres e gerires os teus bilhetes.
          </p>
          <Link
            href="/auth/signin"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-[13px] font-semibold text-black/90 shadow-[0_18px_60px_rgba(0,0,0,.18)] transition hover:bg-white"
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
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <div className="text-[11px] uppercase tracking-wider text-white/45">Conta</div>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-white/90">
            Os meus bilhetes
          </h1>
          <p className="mt-2 text-sm sm:text-[14px] text-white/60 max-w-2xl">
            Acede rapidamente aos teus bilhetes. Abre um bilhete para ver o QR e detalhes do evento.
          </p>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-10 sm:p-14 text-center shadow-[0_18px_60px_rgba(0,0,0,.45)]">
            <div className="mx-auto mb-3 h-12 w-12 rounded-2xl border border-white/10 bg-white/5" />
            <p className="text-white/70 text-[14px] sm:text-[15px]">
              Ainda não tens bilhetes comprados.
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/90 px-5 py-3 text-[13px] font-semibold text-black/90 transition hover:bg-white"
            >
              Explorar eventos
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
                  className={[
                    "group relative overflow-hidden rounded-3xl",
                    "border border-white/10 bg-white/5 backdrop-blur-2xl",
                    "shadow-[0_18px_60px_rgba(0,0,0,.45)]",
                    "transition-all duration-200 hover:bg-white/6 hover:border-white/16 active:scale-[0.99]",
                  ].join(" ")}
                >
                  {/* subtle hover highlight */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/6 blur-3xl" />
                  </div>

                  {/* Cover */}
                  {ticket.event.coverImage ? (
                    <div className="relative h-44 w-full">
                      <Image
                        src={ticket.event.coverImage}
                        alt={ticket.event.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* status pill */}
                      <div className="absolute left-4 top-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
                            used
                              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                              : "border border-white/10 bg-black/35 text-white/80",
                          ].join(" ")}
                        >
                          {used ? "Utilizado" : "Ativo"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-16 w-full bg-white/5 border-b border-white/10">
                      <div className="absolute left-4 top-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
                            used
                              ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
                              : "border border-white/10 bg-white/5 text-white/80",
                          ].join(" ")}
                        >
                          {used ? "Utilizado" : "Ativo"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Body */}
                  <div className="relative p-5 sm:p-6">
                    <div className="text-[11px] uppercase tracking-wider text-white/45">
                      {ticket.event.city || "—"}
                    </div>

                    <h2 className="mt-2 text-[18px] sm:text-[20px] font-semibold text-white/92 leading-snug">
                      {ticket.event.title}
                    </h2>

                    <div className="mt-4 space-y-2 text-[12px] text-white/60">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/40 uppercase tracking-wider">Local</span>
                        <span className="text-white/75 text-right">
                          {ticket.event.venue}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/40 uppercase tracking-wider">Data</span>
                        <span className="text-white/75">{formatDate(ticket.event.startAt)}</span>
                      </div>

                      <div className="h-px bg-white/10 my-3" />

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-white/40 uppercase tracking-wider">Código</span>
                        <span className="font-mono text-[12px] font-semibold text-white/85">
                          {ticket.code}
                        </span>
                      </div>
                    </div>

                    {/* CTA hint */}
                    <div className="mt-5 inline-flex items-center gap-2 text-[12px] text-white/60">
                      <span className="h-8 w-8 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                        <span className="text-white/80">→</span>
                      </span>
                      <span className="group-hover:text-white/85 transition">
                        Abrir bilhete
                      </span>
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
