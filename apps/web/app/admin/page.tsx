import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function StatCard({
  label,
  value,
  tone = "neutral",
  href,
  footnote,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "yellow" | "blue" | "green" | "purple" | "orange";
  href?: string;
  footnote?: React.ReactNode;
}) {
  const toneMap = {
    neutral: "text-white/92",
    yellow: "text-amber-300",
    blue: "text-sky-300",
    green: "text-emerald-300",
    purple: "text-violet-300",
    orange: "text-orange-300",
  } as const;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl",
        "border border-white/10 bg-white/5 backdrop-blur-2xl",
        "p-6 md:p-7",
        "shadow-[0_18px_60px_rgba(0,0,0,.35)]",
        "transition-all duration-200",
        "hover:bg-white/6 hover:border-white/14"
      )}
    >
      {/* soft highlight */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-white/6 blur-3xl" />

      <div className="relative">
        <div className="text-[11px] uppercase tracking-wider text-white/55">{label}</div>

        <div className={cn("mt-3 text-4xl md:text-5xl font-semibold tracking-tight", toneMap[tone])}>
          {value}
        </div>

        {footnote && <div className="mt-2 text-sm text-white/55">{footnote}</div>}

        {href && (
          <Link
            href={href}
            className={cn(
              "mt-5 inline-flex items-center gap-2",
              "text-[12px] font-semibold text-white/70 hover:text-white",
              "transition"
            )}
          >
            Ver detalhes <span className="opacity-60">→</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  tone = "neutral",
}: {
  title: string;
  description: React.ReactNode;
  href: string;
  tone?: "neutral" | "yellow" | "orange" | "green" | "purple";
}) {
  const toneBg = {
    neutral: "bg-white/5 border-white/10",
    yellow: "bg-amber-500/10 border-amber-500/30",
    orange: "bg-orange-500/10 border-orange-500/30",
    green: "bg-emerald-500/10 border-emerald-500/30",
    purple: "bg-violet-500/10 border-violet-500/30",
  } as const;

  return (
    <Link
      href={href}
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 md:p-6",
        "backdrop-blur-2xl transition-all duration-200",
        toneBg[tone],
        "hover:border-white/18 hover:bg-white/7"
      )}
    >
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/6 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative">
        <div className="text-[13px] font-semibold text-white/90">{title}</div>
        <div className="mt-2 text-[12px] leading-relaxed text-white/60">{description}</div>
        <div className="mt-4 text-[12px] font-semibold text-white/70 group-hover:text-white transition">
          Abrir <span className="opacity-60">→</span>
        </div>
      </div>
    </Link>
  );
}

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

  return (
    <div className="w-full min-w-0 mx-auto max-w-7xl space-y-6 sm:space-y-8 px-2 sm:px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-white/50">Admin</div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white/90">
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-white/55">
          Operação, aprovações e métricas essenciais.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          label="Promotores pendentes"
          value={pendingOrganizers}
          tone="yellow"
          href="/admin/organizers?status=PENDING"
        />

        <StatCard
          label="Total de eventos"
          value={totalEvents}
          tone="blue"
          footnote={
            <span>
              <span className="text-white/70 font-semibold">{publishedEvents}</span>{" "}
              <span className="text-white/45">publicados</span>
            </span>
          }
        />

        <StatCard label="Pedidos pagos" value={totalOrders} tone="green" />

        <StatCard label="Receita total" value={eur.format(revenueCents / 100)} tone="purple" />
      </div>

      {/* Quick Actions */}
      <div
        className={cn(
          "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl",
          "p-6 md:p-8",
          "shadow-[0_18px_60px_rgba(0,0,0,.35)]"
        )}
      >
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/50">Operação</div>
            <h2 className="mt-2 text-xl md:text-2xl font-semibold text-white/90">Ações rápidas</h2>
          </div>

          <div className="text-[12px] text-white/55">
            Pendências:{" "}
            <span className="text-white/80 font-semibold">
              {pendingOrganizers + pendingEvents}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <ActionCard
            href="/admin/organizers?status=PENDING"
            title="Aprovar promotores"
            description={
              <>
                <span className="text-white/80 font-semibold">{pendingOrganizers}</span>{" "}
                aguardando aprovação.
              </>
            }
            tone="yellow"
          />

          <ActionCard
            href="/admin/events/pending"
            title="Aprovar eventos"
            description={
              <>
                <span className="text-white/80 font-semibold">{pendingEvents}</span>{" "}
                em rascunho pendente.
              </>
            }
            tone="orange"
          />

          <ActionCard
            href="/admin/events/new"
            title="Criar evento"
            description="Criar novo evento como admin."
            tone="green"
          />

          <ActionCard
            href="/admin/audit"
            title="Auditoria"
            description="Transferências, check-ins e ações críticas."
            tone="purple"
          />
        </div>
      </div>
    </div>
  );
}