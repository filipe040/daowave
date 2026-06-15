import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPromoterOverview } from "@/lib/services/promoter-overview.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Ticket, CircleCheck, FileText, CircleDollarSign, Calendar, ChevronRight } from "lucide-react";

export default async function OrganizerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?from=/organizer");
  }

  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizerProfile || organizerProfile.status !== "APPROVED") {
    redirect("/");
  }

  const [overview, recentEvents] = await Promise.all([
    getPromoterOverview({ promoterId: organizerProfile.id }),
    prisma.event.findMany({
      where: { promoterId: organizerProfile.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        startAt: true,
        createdAt: true,
      },
    }),
  ]);

  const draftEvents = overview.eventsTotal - overview.eventsActive;

  return (
    <div className="w-full min-w-0 max-w-7xl mx-auto space-y-6 md:space-y-8 px-2 sm:px-4 md:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Dashboard</h1>
          <p className="text-base md:text-lg text-zinc-500">Bem-vindo, {organizerProfile.brandName}</p>
        </div>
        <Link
          href="/organizer/events/new"
          className="bg-[#00a0e3] hover:bg-[#0090cc] px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold text-white transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 whitespace-nowrap"
        >
          + Criar Evento
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-neutral-100/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
            <Ticket className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="text-4xl md:text-5xl font-bold mb-2">{overview.eventsTotal}</div>
          <div className="text-sm md:text-base text-zinc-500">Total de Eventos</div>
        </div>

        <div className="bg-neutral-100/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
            <CircleCheck className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="text-4xl md:text-5xl font-bold mb-2">{overview.eventsActive}</div>
          <div className="text-sm md:text-base text-zinc-500">Publicados</div>
        </div>

        <div className="bg-neutral-100/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
            <FileText className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="text-4xl md:text-5xl font-bold mb-2">{draftEvents}</div>
          <div className="text-sm md:text-base text-zinc-500">Rascunhos</div>
        </div>

        <div className="bg-neutral-100/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-zinc-500">
            <CircleDollarSign className="h-6 w-6" strokeWidth={1.5} />
          </div>
          <div className="text-4xl md:text-5xl font-bold mb-2">
            {(overview.revenueCents / 100).toFixed(2)}€
          </div>
          <div className="text-sm md:text-base text-zinc-500">Receita Total</div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-neutral-100/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">Eventos Recentes</h2>
          <Link
            href="/organizer/events"
            className="text-sm md:text-base text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-1"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-zinc-500">
              <Calendar className="h-8 w-8" strokeWidth={1.5} />
            </div>
            <p className="text-lg md:text-xl text-zinc-500 mb-6">Ainda não criou nenhum evento</p>
            <Link
              href="/organizer/events/new"
              className="inline-block bg-[#00a0e3] hover:bg-[#0090cc] px-8 py-4 rounded-xl text-base md:text-lg font-semibold text-white transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
            >
              Criar Primeiro Evento
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/organizer/events/${event.id}/edit`}
                className="flex items-center justify-between p-5 md:p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-base md:text-lg group-hover:text-purple-400 transition-colors truncate">
                      {event.title}
                    </h3>
                    <span
                      className={`text-xs md:text-sm px-3 py-1 rounded-lg ${event.status === "PUBLISHED"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                    >
                      {event.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-zinc-500">
                    {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-purple-400 transition-colors ml-4" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
