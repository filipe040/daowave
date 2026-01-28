import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import TeamsContent from "./components/teams-content";

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
    include: {
      teamMembers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          permissions: {
            select: {
              permission: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          teamMembers: true,
        },
      },
    },
  });

  if (!event) {
    return null;
  }

  // Calculate stats
  const totalMembers = event.teamMembers.length;
  const activeStaff = event.teamMembers.filter((m) => m.isActive && !m.isVolunteer).length;
  const volunteers = event.teamMembers.filter((m) => m.isVolunteer).length;
  const recentAccesses = event.teamMembers.filter(
    (m) => m.lastAccessAt && m.lastAccessAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  return {
    event: {
      id: event.id,
      title: event.title,
      slug: event.slug,
    },
    teamMembers: event.teamMembers.map((m) => ({
      id: m.id,
      userId: m.userId,
      userName: m.user.name || m.user.email,
      userEmail: m.user.email,
      role: m.role,
      isActive: m.isActive,
      isVolunteer: m.isVolunteer,
      notes: m.notes,
      createdAt: m.createdAt,
      lastAccessAt: m.lastAccessAt,
      permissions: m.permissions.map((p) => p.permission),
    })),
    stats: {
      totalMembers,
      activeStaff,
      volunteers,
      recentAccesses,
    },
  };
}

export default async function EventTeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/promotor/login");
  }

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "PROMOTER" && userRole !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Acesso restrito a promotores.</p>
      </div>
    );
  }

  const data = await getEventData(id, session.user.id!);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Evento não encontrado.</p>
      </div>
    );
  }

  return <TeamsContent event={data.event} teamMembers={data.teamMembers} stats={data.stats} />;
}
