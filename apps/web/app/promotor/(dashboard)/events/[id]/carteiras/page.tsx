import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CashlessSystemContent from "./components/cashless-system-content";

export const dynamic = "force-dynamic";

async function getEventData(eventId: string, userId: string) {
  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId },
  });

  if (!promoter) {
    return null;
  }

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      promoterId: promoter.id,
    },
    select: {
      id: true,
      title: true,
      slug: true,
    },
  });

  return event;
}

export default async function CashlessSystemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const event = await getEventData(id, session.user.id);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Evento não encontrado ou não autorizado.</p>
      </div>
    );
  }

  // Mock stats - these would come from a cashless system in production
  const stats = {
    floatingCapital: 0,
    activeAccounts: 0,
    totalLoaded: 0,
    salesVolume: 0,
    refunds: 0,
    ledgerHealth: 100,
    capitalChange: 12.5,
  };

  return <CashlessSystemContent event={event} stats={stats} />;
}
