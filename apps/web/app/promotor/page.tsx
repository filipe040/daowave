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
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              tickets: true,
              orders: true,
            },
          },
        },
      },
    },
  });

  return promoter?.events || [];
}

export default async function PromoterDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/promotor/login");
  }

  const userRole = (session.user as any).role;
  if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Acesso restrito a promotores.</p>
      </div>
    );
  }

  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!promoter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Perfil de promotor não encontrado.</p>
      </div>
    );
  }

  const events = await getPromoterEvents(session.user.id);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <PromoterHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Select Workspace Title */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
          <div className="h-px w-12 sm:w-16 md:w-20 bg-white/30"></div>
          <h2 className="text-xs sm:text-sm md:text-base text-white/70 uppercase tracking-wider">
            SELECIONE O AMBIENTE DE TRABALHO
          </h2>
          <div className="h-px w-12 sm:w-16 md:w-20 bg-white/30"></div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white uppercase tracking-tight leading-none">
            LIVEGRID
          </h1>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-600 uppercase tracking-tight leading-none">
            WORKSPACE.
          </h2>
        </div>

        {/* Search Bar */}
        <EventsWorkspace events={events} />

        {/* Footer Info */}
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 text-xs sm:text-sm text-white/50">
          <div className="flex flex-col">
            <span>LIVEGRID TERMINAL V4.0.0</span>
          </div>
          <div className="text-white/50">LIS-HUB-01</div>
        </div>
      </main>
    </div>
  );
}
