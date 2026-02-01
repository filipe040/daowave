import { prisma } from "@/lib/prisma";
import { getAdminOverview } from "@/lib/services/admin-overview.service";
import type { Prisma } from "@prisma/client";
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

type EventWithPromoterUser = Prisma.EventGetPayload<{
  include: {
    promoter: {
      include: {
        user: { select: { name: true; email: true } };
      };
    };
  };
}>;

const recentEventsQuery = () =>
  prisma.event.findMany({
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

export default async function AdminDashboardContent() {
  let overview: Awaited<ReturnType<typeof getAdminOverview>>;
  let pendingOrganizers: number;
  let pendingEventsCount: number;
  let recentEvents: EventWithPromoterUser[];

  try {
    const [overviewRes, pendingOrganizersRes, pendingEventsCountRes, recentEventsRes] =
      await Promise.all([
        getAdminOverview(),
        prisma.promoterProfile.count({ where: { status: "PENDING" } }),
        prisma.event.count({
          where: {
            status: "DRAFT",
            promoter: { user: { role: "PROMOTER" } },
          },
        }),
        recentEventsQuery(),
      ]);
    overview = overviewRes;
    pendingOrganizers = pendingOrganizersRes;
    pendingEventsCount = pendingEventsCountRes;
    recentEvents = recentEventsRes;
  } catch (err) {
    console.error("[admin-dashboard-content] error:", err);
    overview = {
      gmvCents: 0,
      ordersPaid: 0,
      ticketsSold: 0,
      eventsTotal: 0,
      eventsActive: 0,
      promotersTotal: 0,
      promotersApproved: 0,
    };
    pendingOrganizers = 0;
    pendingEventsCount = 0;
    recentEvents = [];
  }

  const pendingCount = pendingOrganizers + pendingEventsCount;

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto space-y-12 md:space-y-16 px-4 sm:px-6 lg:px-8 pb-16" data-testid="page-admin-dashboard">
      <header className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
              Dashboard Admin
            </h1>
            <p className="mt-1.5 text-[15px] text-muted-foreground">
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
              className="inline-flex items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 px-5 py-2.5 text-[15px] font-medium transition-colors"
            >
              Criar Evento
            </Link>
          </div>
        </div>
      </header>

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
              value: overview.eventsTotal,
              label: "Total de eventos",
              sub: `${overview.eventsActive} publicados`,
            },
            {
              href: "/admin/payments",
              icon: ShoppingBag,
              value: overview.ordersPaid,
              label: "Pedidos pagos",
              sub: "Ver pagamentos",
            },
            {
              href: "/admin/payments",
              icon: CircleDollarSign,
              value: `${(overview.gmvCents / 100).toFixed(2)}€`,
              label: "GMV total",
              sub: "Ver detalhes",
            },
          ].map(({ href, icon: Icon, value, label, sub }) => (
            <Link
              key={href + label}
              href={href}
              className="group flex flex-col rounded-2xl border border-border bg-card/50 p-6 sm:p-7 transition-colors hover:bg-card"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                {value}
              </div>
              <div className="mt-1 text-[13px] text-muted-foreground">{label}</div>
              <div className="mt-3 flex items-center gap-1 text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">
                {sub}
                <ChevronRight className="h-4 w-4 opacity-70" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">Ações rápidas</h2>
          {pendingCount > 0 && (
            <span className="text-[13px] text-amber-500">{pendingCount} pendência(s)</span>
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
              desc: `${pendingEventsCount} em rascunho`,
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
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-5 transition-colors hover:bg-card"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                  accent === "amber"
                    ? "bg-amber-500/10 text-amber-600 group-hover:bg-amber-500/20"
                    : accent === "green"
                    ? "bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20"
                    : "bg-purple-500/10 text-purple-600 group-hover:bg-purple-500/20"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[15px] text-foreground">{title}</div>
                <div className="text-[13px] text-muted-foreground">{desc}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground">Eventos recentes</h2>
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-1 text-[14px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 overflow-hidden">
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
                <Calendar className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="text-[15px] text-muted-foreground mb-6">Ainda não há eventos</p>
              <Link
                href="/admin/events/new"
                className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-5 py-2.5 text-[15px] font-medium hover:opacity-90 transition-colors"
              >
                Criar evento
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={
                      event.status === "PUBLISHED"
                        ? `/events/${event.slug}`
                        : `/promotor/events/${event.id}`
                    }
                    target={event.status === "PUBLISHED" ? "_blank" : undefined}
                    className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-medium text-[15px] text-foreground group-hover:underline truncate">
                          {event.title}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium ${
                            event.status === "PUBLISHED"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {event.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {format(new Date(event.startAt), "dd MMM yyyy, HH:mm", { locale: pt })}
                        {event.promoter?.user?.email != null && (
                          <span className="text-muted-foreground/80"> · {event.promoter.user.email}</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
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
