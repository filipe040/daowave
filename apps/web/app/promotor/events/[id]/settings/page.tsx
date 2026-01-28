import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import EventSettingsContent from "./components/event-settings-content";

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
      description: true,
      venue: true,
      city: true,
      startAt: true,
      endAt: true,
      coverImage: true,
      status: true,
      archivedAt: true,
    },
  });

  return event;
}

export default async function EventSettingsPage({
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
        <p>Evento não encontrado.</p>
      </div>
    );
  }

  return <EventSettingsContent event={event} />;
}
