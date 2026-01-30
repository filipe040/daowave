import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  Users,
  Ticket,
  ShoppingBag,
  CircleDollarSign,
  UserCheck,
  ClipboardList,
  PlusCircle,
  FileText,
  Calendar,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    pendingOrganizers,
    pendingEvents,
    totalEvents,
    publishedEvents,
    totalOrders,
    totalRevenue,
  ] = await Promise.all([
    prisma.promoterProfile.count({ where: { status: "PENDING" } }),
    prisma.event.count({
      where: {
        status: "DRAFT",
        promoter: { user: { role: "PROMOTER" } },
      },
    }),
    prisma.event.count(),
    prisma.event.count({ where: { status: "PUBLISHED" } }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalCents: true },
    }),
  ]);

  const revenueCents = totalRevenue._sum.totalCents ?? 0;

  const recentEvents = await prisma.event.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      promoter: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  const pendingCount = pendingOrganizers + pendingEvents;

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto space-y-12 md:space-y-16 px-4 sm:px-6 lg:px-8 pb-16">
      {/* Header — Apple-style: clean, generous spacing */}
      <header className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="mt-1.5 text-[15px] text-zinc-400">
              Bem-vindo ao painel de administração
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {pendingCount > 0 && (
              <Link
                href="/admin/organizers?status=PENDING"
                className="inline-flex items-center justify-center rounded-full bg-amber-500/90 hover:bg-amber-500 px-5 py-2.5 text-[15px] font-medium text-white transition-colors"
              >
                Aprovar pendências ({pendingCount})
              </Link>
            )}
            <Link
              href="/admin/events/new"
              className="inline-flex items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200 px-5 py-2.5 text-[15px] font-medium transition-colors"
            >
              Criar Evento
            </Link>
          </div>
        </div>
      </header>

      {/* Stats — Apple-style cards: soft bg, subtle border, icon in circle */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[
            {
              href: "/admin/organizers?status=PENDING",
              icon: Users,
              value: pendingOrganizers,
              label: "Promotores pendentes",
              sub: "Ver pendentes",
            },
            {
              href: "/admin/events",
              icon: Ticket,
              value: totalEvents,
              label: "Total de eventos",
              sub: `${publishedEvents} publicados`,
            },
            {
              href: "/admin/payments",
              icon: ShoppingBag,
              value: totalOrders,
              label: "Pedidos pagos",
              sub: "Ver pagamentos",
            },
            {
              href: "/admin/payments",
              icon: CircleDollarSign,
              value: `${(revenueCents / 100).toFixed(2)}€`,
              label: "Receita total",
              sub: "Ver detalhes",
            },
          ].map(({ href, icon: Icon, value, label, sub }) => (
            <Link
              key={href + label}
              href={href}
              className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 sm:p-7 transition-colors hover:bg-white/[0.05]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-400 group-hover:bg-white/[0.08] group-hover:text-zinc-300 transition-colors">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-semibold tracking-tight text-white tabular-nums">
                {value}
              </div>
              <div className="mt-1 text-[13px] text-zinc-500">{label}</div>
              <div className="mt-3 flex items-center gap-1 text-[13px] text-zinc-400 group-hover:text-white transition-colors">
                {sub}
                <ChevronRight className="h-4 w-4 opacity-70" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions — Apple-style list cards */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-white">Ações rápidas</h2>
          {pendingCount > 0 && (
            <span className="text-[13px] text-amber-400/90">{pendingCount} pendência(s)</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              href: "/admin/organizers?status=PENDING",
              icon: UserCheck,
              title: "Aprovar promotores",
              desc: `${pendingOrganizers} pendentes`,
              accent: "amber",
            },
            {
              href: "/admin/events/pending",
              icon: ClipboardList,
              title: "Aprovar eventos",
              desc: `${pendingEvents} em rascunho`,
              accent: "purple",
            },
            {
              href: "/admin/events/new",
              icon: PlusCircle,
              title: "Criar evento",
              desc: "Novo evento como admin",
              accent: "green",
            },
            {
              href: "/admin/audit",
              icon: FileText,
              title: "Auditoria",
              desc: "Check-ins e transferências",
              accent: "purple",
            },
          ].map(({ href, icon: Icon, title, desc, accent }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-400 transition-colors ${
                  accent === "amber"
                    ? "group-hover:bg-amber-500/15 group-hover:text-amber-400"
                    : accent === "green"
                    ? "group-hover:bg-emerald-500/15 group-hover:text-emerald-400"
                    : "group-hover:bg-purple-500/15 group-hover:text-purple-400"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[15px] text-white">{title}</div>
                <div className="text-[13px] text-zinc-500">{desc}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      {/* Recent events — Apple-style list */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-white">Eventos recentes</h2>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1 text-[14px] text-zinc-400 hover:text-white transition-colors"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-zinc-500 mb-4">
                <Calendar className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="text-[15px] text-zinc-400 mb-6">Ainda não há eventos</p>
              <Link
                href="/admin/events/new"
                className="inline-flex items-center justify-center rounded-full bg-white text-zinc-900 hover:bg-zinc-200 px-5 py-2.5 text-[15px] font-medium transition-colors"
              >
                Criar evento
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {recentEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.slug}`}
                    target="_blank"
                    className="flex items-center gap-4 p-5 transition-colors hover:bg-white/[0.03] group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-medium text-[15px] text-white group-hover:text-zinc-200 truncate">
                          {event.title}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium ${
                            event.status === "PUBLISHED"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {event.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-zinc-500">
                        {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                        {event.promoter?.user?.email && (
                          <span className="text-zinc-600"> · {event.promoter.user.email}</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
