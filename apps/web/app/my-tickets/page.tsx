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
import { PublicPage, PublicEmptyState, PublicButton } from "@/components/public/public-page";
import { redirect } from "next/navigation";
import { staffDashboardRedirectPath } from "@/lib/auth/public-nav";

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
          coverImage: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions);
  const staffRedirect = staffDashboardRedirectPath(session);
  if (staffRedirect) redirect(staffRedirect);

  if (!session?.user) {
    return (
      <div className="public-shell min-h-screen flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#14141f] p-8 text-center">
          <h1 className="text-xl font-bold text-white">Sessão necessária</h1>
          <p className="mt-2 text-sm text-zinc-400">Faz login para veres os teus bilhetes.</p>
          <div className="mt-6">
            <PublicButton href="/auth/signin">Entrar</PublicButton>
          </div>
        </div>
      </div>
    );
  }

  const tickets = await getTickets(session.user.id);

  return (
    <PublicPage
      title="Os meus bilhetes"
      subtitle="Abre um bilhete para ver o QR code e os detalhes do evento."
      data-testid="page-my-tickets"
    >
      {tickets.length === 0 ? (
        <PublicEmptyState
          icon={Ticket}
          title="Ainda não tens bilhetes"
          description="Explora eventos disponíveis e compra o teu primeiro bilhete."
          action={<PublicButton href="/events">Explorar eventos</PublicButton>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {tickets.map((ticket) => {
            const used = Boolean(ticket.checkedInAt);
            return (
              <Link
                key={ticket.id}
                href={`/ticket/${ticket.id}`}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#14141f] transition-all hover:border-[#00a0e3]/40 hover:shadow-[0_8px_32px_rgba(0,160,227,0.1)]"
              >
                {ticket.event.coverImage ? (
                  <div className="relative h-40 w-full">
                    <Image src={ticket.event.coverImage} alt={ticket.event.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14141f] to-transparent" />
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        used ? "bg-emerald-500 text-white" : "bg-black/60 text-white border border-white/10"
                      }`}
                    >
                      {used ? "Utilizado" : "Ativo"}
                    </span>
                  </div>
                ) : (
                  <div className="h-12 border-b border-white/10 px-4 flex items-center">
                    <span className="text-[10px] font-bold uppercase text-[#5ec8f8]">
                      {used ? "Utilizado" : "Ativo"}
                    </span>
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                    {ticket.event.city}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-white line-clamp-2 group-hover:text-[#5ec8f8] transition-colors">
                    {ticket.event.title}
                  </h2>
                  <div className="mt-3 space-y-2 text-xs sm:text-sm text-zinc-400">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#00a0e3] shrink-0" />
                      <span className="truncate">{ticket.event.venue}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#00a0e3] shrink-0" />
                      {formatDate(ticket.event.startAt)}
                    </p>
                  </div>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#5ec8f8] group-hover:gap-2 transition-all">
                    Abrir bilhete <ArrowRight className="h-4 w-4" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PublicPage>
  );
}
