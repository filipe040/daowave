import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Info } from "lucide-react";
import AdminEventForm from "../components/admin-event-form";

export default async function AdminNewEventPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/signin?from=/admin/events/new");
  }

  // Get or create admin organizer profile
  let adminOrganizer = await prisma.promoterProfile.findFirst({
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
      adminOrganizer = await prisma.promoterProfile.create({
        data: {
          userId: adminUser.id,
          brandName: "EasyTicket Admin",
        },
      });
    }
  }

  // Get all approved organizers for selection
  const approvedOrganizers = await prisma.promoterProfile.findMany({
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

      <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 backdrop-blur-sm">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" strokeWidth={1.5} />
        <p className="text-sm text-blue-300">
          Eventos criados por administradores são publicados automaticamente. Eventos criados por promotores precisam de aprovação.
        </p>
      </div>

      <AdminEventForm 
        defaultOrganizerId={adminOrganizer?.id} 
        availableOrganizers={approvedOrganizers}
      />
    </div>
  );
}

