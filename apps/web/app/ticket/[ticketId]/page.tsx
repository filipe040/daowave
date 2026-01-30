/**
 * Ticket Detail Page with QR Code (token-based theme + high contrast)
 */

import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { generateQRCode } from "@/lib/qr/generate";
import Image from "next/image";

export const dynamic = "force-dynamic";

async function getTicket(ticketId: string) {
  return prisma.ticket.findUnique({
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
      <div className="min-h-screen grid place-items-center px-4 bg-background text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl opacity-80">🔒</div>
          <h1 className="text-2xl font-semibold">Autenticação necessária</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Faça login para aceder ao seu bilhete.
          </p>
          <a
            href="/auth/signin"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground
                       transition-colors hover:bg-primary/90
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Iniciar sessão
          </a>
        </div>
      </div>
    );
  }

  const { ticketId } = await params;
  const ticket = await getTicket(ticketId);

  if (!ticket || ticket.userId !== session.user.id) {
    notFound();
  }

  const qrDataUrl = await generateQRCode({
    ticketId: ticket.id,
    code: ticket.code,
  });

  const isUsed = Boolean(ticket.checkedInAt);

  return (
    <div className="min-h-screen bg-background text-foreground py-10 sm:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Cover */}
          {ticket.event.coverImage ? (
            <div className="relative h-56 sm:h-64 w-full">
              <Image
                src={ticket.event.coverImage}
                alt={ticket.event.title}
                fill
                priority
                className="object-cover"
              />
              {/* Soft overlay for readability */}
              <div className="absolute inset-0 bg-black/40" />

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      Bilhete
                    </p>
                    <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-white">
                      {ticket.event.title}
                    </h1>
                  </div>

                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                      isUsed
                        ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                        : "border-white/25 bg-white/10 text-white/90",
                    ].join(" ")}
                  >
                    {isUsed ? "Utilizado" : "Ativo"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 border-b border-border">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bilhete
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-semibold">
                {ticket.event.title}
              </h1>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* Left */}
              <div className="space-y-5">
                {/* Ticket code */}
                <div className="rounded-2xl border border-border bg-background p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Código do bilhete
                  </p>
                  <p className="mt-2 font-mono text-lg sm:text-xl font-semibold text-foreground">
                    {ticket.code}
                  </p>
                </div>

                {/* Event details */}
                <div className="rounded-2xl border border-border bg-background p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Evento
                  </p>

                  <div className="mt-4 space-y-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Local</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {ticket.event.venue}
                      </p>
                      <p className="text-muted-foreground">{ticket.event.city}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Data e hora</p>
                      <p className="mt-1 font-semibold text-foreground">
                        {formatDate(ticket.event.startAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Used banner */}
                {ticket.checkedInAt && (
                  <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-5">
                    <p className="text-sm font-semibold text-foreground">
                      ✓ Bilhete utilizado
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Check-in em {formatDate(ticket.checkedInAt)}
                    </p>
                  </div>
                )}

                {/* Order meta (optional but useful) */}
                {ticket.order?.id && (
                  <div className="rounded-2xl border border-border bg-background p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pedido
                    </p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        ID: <span className="text-foreground">{ticket.order.id}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Criado:{" "}
                        <span className="text-foreground">
                          {formatDate(ticket.order.createdAt)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="flex flex-col items-center justify-start">
                <div className="w-full rounded-2xl border border-border bg-background p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold text-foreground">Código QR</h2>
                    <span className="text-xs text-muted-foreground">Entrada</span>
                  </div>

                  <div className="mt-4 grid place-items-center rounded-2xl border border-border bg-card p-4">
                    <Image
                      src={qrDataUrl}
                      alt="QR Code"
                      width={320}
                      height={320}
                      className="h-auto w-full max-w-[320px]"
                    />
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground text-center">
                    Apresente este QR na entrada do evento.
                  </p>
                </div>

                {/* Action */}
                <div className="mt-4 w-full">
                  <a
                    href={`/events/${ticket.event.slug}`}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground border border-border
                           transition-colors hover:bg-secondary/80
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    Ver página do evento
                  </a>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-8 border-t border-border pt-5">
              <p className="text-xs text-muted-foreground">
                Segurança: não partilhe o seu código. Este bilhete é pessoal e intransmissível.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}