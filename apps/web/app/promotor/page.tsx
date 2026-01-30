import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import EventsWorkspace from "./components/events-workspace";
import PromoterHeader from "./components/promoter-header";

export const dynamic = "force-dynamic";

async function getPromoterEvents(userId: string) {
  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { tickets: true, orders: true } },
        },
      },
    },
  });

  return promoter?.events || [];
}

function EmptyStateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card/70 backdrop-blur-2xl p-7 shadow-[0_18px_60px_rgba(0,0,0,.45)]">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Estúdio</div>
          <h1 className="mt-2 text-xl font-semibold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default async function PromoterDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/promotor/login");

  const userRole = (session.user as any).role;
  if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
    return (
      <EmptyStateCard
        title="Acesso restrito"
        description="Esta área é exclusiva para promotores e administradores."
      />
    );
  }

  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!promoter) {
    return (
      <EmptyStateCard
        title="Perfil não encontrado"
        description="Não existe um perfil de promotor associado a esta conta."
      />
    );
  }

  const events = await getPromoterEvents(session.user.id);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/35" />
      </div>

      {/* Header */}
      <PromoterHeader />

      {/* Main */}
      <main className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Eyebrow */}
        <div className="mx-auto mb-7 flex max-w-3xl items-center justify-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <div className="text-[11px] sm:text-[12px] uppercase tracking-[0.22em] text-muted-foreground">
            Selecionar ambiente de trabalho
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Titles */}
        <div className="text-center mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground">
            EASYTICKET
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Workspace para gestão de experiências, bilhética e operação.
          </p>
        </div>

        {/* Workspace */}
        <EventsWorkspace events={events} />

        {/* Footer (flow, not absolute) */}
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-muted-foreground">
          <div className="flex flex-col">
            <span>EASYTICKET TERMINAL</span>
            <span className="text-foreground/50">LIS-HUB-01</span>
          </div>

          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px]">
            {userRole}
          </span>
        </div>
      </main>
    </div>
  );
}