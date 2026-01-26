import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminEventForm from "../components/admin-event-form";

export default async function AdminNewEventPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin?from=/admin/events/new");
  }

  // Get or create admin organizer profile
  let adminOrganizer = await prisma.organizerProfile.findFirst({
    where: {
      user: {
        role: "ADMIN",
      },
    },
  });

  // If no admin organizer exists, create one
  if (!adminOrganizer) {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (adminUser) {
      adminOrganizer = await prisma.organizerProfile.create({
        data: {
          userId: adminUser.id,
          brandName: "7even Tickets Admin",
          status: "APPROVED",
        },
      });
    }
  }

  // Get all approved organizers for selection
  const approvedOrganizers = await prisma.organizerProfile.findMany({
    where: { status: "APPROVED" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      brandName: "asc",
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Criar Novo Evento (Admin)</h1>
        <p className="text-zinc-400">
          Como administrador, pode criar eventos que serão publicados imediatamente
        </p>
      </div>

      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 backdrop-blur-sm">
        <p className="text-sm text-blue-300">
          ℹ️ Eventos criados por administradores são publicados automaticamente. Eventos criados por promotores precisam de aprovação.
        </p>
      </div>

      <AdminEventForm 
        defaultOrganizerId={adminOrganizer?.id} 
        availableOrganizers={approvedOrganizers}
      />
    </div>
  );
}

