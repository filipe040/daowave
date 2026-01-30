import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import EventsWorkspace from "../components/events-workspace";
import AdminDashboardContent from "../components/admin-dashboard-content";

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
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/70 backdrop-blur-2xl p-7 shadow-lg">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Estúdio</div>
        <h1 className="mt-2 text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default async function PromoterDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/promotor/login");

  const userRole = (session.user as { role?: string }).role;
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
    if (userRole === "ADMIN") {
      return <AdminDashboardContent />;
    }
    return (
      <EmptyStateCard
        title="Perfil não encontrado"
        description="Não existe um perfil de promotor associado a esta conta."
      />
    );
  }

  const events = await getPromoterEvents(session.user.id);

  return (
    <div className="relative">
      <div className="mx-auto mb-7 flex max-w-3xl items-center justify-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <div className="text-[11px] sm:text-[12px] uppercase tracking-[0.22em] text-muted-foreground">
          Selecionar ambiente de trabalho
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-foreground">
          EasyTicket
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          Workspace para gestão de experiências, bilhética e operação.
        </p>
      </div>

      <EventsWorkspace events={events} />

      <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-muted-foreground">
        <div className="flex flex-col">
          <span>EASYTICKET TERMINAL</span>
          <span className="text-foreground/50">LIS-HUB-01</span>
        </div>
        <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px]">
          {userRole}
        </span>
      </div>
    </div>
  );
}
