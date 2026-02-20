import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { generateQrCodeDataUrl, generateQrToken } from "@/lib/qr";

export const dynamic = "force-dynamic";

async function getTicket(ticketId: string, userId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      event: true,
      ticketLot: true,
      user: {
        select: {
          email: true,
          name: true,
        },
      },
      order: {
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!ticket || ticket.userId !== userId) {
    return null;
  }

  return ticket;
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return notFound();
  }

  const { id } = await params;
  const ticket = await getTicket(id, session.user.id);
  if (!ticket) {
    return notFound();
  }

  // TODO: Add qrNonce to Ticket model or use qrPayload
  // const qrToken = generateQrToken(ticket.id, ticket.event.id, ticket.qrNonce);
  // const qrDataUrl = await generateQrCodeDataUrl(ticket.id, ticket.event.id, ticket.qrNonce);
  const qrToken = ""; // Placeholder until qrNonce is added
  const qrDataUrl = ""; // Placeholder until qrNonce is added

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-0 animate-fade-in">
      <div>
        <Link
          href="/my-tickets"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <span>←</span>
          <span>Voltar aos meus bilhetes</span>
        </Link>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold">{ticket.event.title}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-bold">Detalhes do bilhete</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Tipo</span>
              <p className="mt-1 text-lg font-semibold">{ticket.ticketLot.name}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Lote</span>
              <p className="mt-1 text-lg font-semibold">{ticket.ticketLot.name}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Participante</span>
              <p className="mt-1 text-lg font-semibold">{ticket.user.name || "N/A"}</p>
              <p className="mt-1 text-sm text-zinc-500">{ticket.user.email}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Status</span>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${!ticket.checkedInAt
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    }`}
                >
                  {!ticket.checkedInAt ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                      Válido
                    </>
                  ) : (
                    "Utilizado"
                  )}
                </span>
              </div>
            </div>
            {ticket.checkedInAt && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <span className="text-xs font-medium text-green-400 uppercase tracking-wide">Check-in</span>
                <p className="mt-1 text-lg font-semibold text-green-400">
                  Check-in realizado
                </p>
                <p className="mt-1 text-sm text-green-400/70">
                  {ticket.checkedInAt && format(new Date(ticket.checkedInAt), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-bold">Código QR</h2>
          <div className="flex flex-col items-center space-y-6">
            <div className="rounded-xl border-4 border-white bg-white p-4 shadow-2xl">
              <Image
                src={qrDataUrl || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
                alt="QR Code"
                width={224}
                height={224}
                className="h-48 w-48 sm:h-56 sm:w-56"
                unoptimized
              />
            </div>
            <div className="w-full rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 text-center">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                Código do bilhete
              </p>
              <p className="font-mono text-xs break-all text-zinc-300">{ticket.id}</p>
            </div>
            <a
              href={`/api/tickets/${ticket.id}/pdf`}
              target="_blank"
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-center text-sm font-bold text-white shadow-lg shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/50 active:scale-95"
            >
              📥 Descarregar PDF
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-sm">
        <h2 className="mb-6 text-xl font-bold">Informações do evento</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Data</span>
            <p className="mt-1 text-base font-semibold">
              {format(new Date(ticket.event.startAt), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Local</span>
            <p className="mt-1 text-base font-semibold">{ticket.event.venue}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4 sm:col-span-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Endereço</span>
            <p className="mt-1 text-base font-semibold">
              {ticket.event.city}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
