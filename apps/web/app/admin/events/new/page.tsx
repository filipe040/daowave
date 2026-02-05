import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EventForm from "@/app/organizer/events/components/event-form";

export default async function AdminNewEventPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/promotor");
  }

  const approvedOrganizers = await prisma.promoterProfile.findMany({
    where: { status: "APPROVED" },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { brandName: "asc" },
  });

  const defaultPromoterId = approvedOrganizers[0]?.id ?? "";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Criar Novo Evento</h1>
        <p className="text-zinc-400">
          Preencha todas as informações do evento. O evento será publicado automaticamente.
        </p>
      </div>

      <EventForm
        isAdminCreate
        availableOrganizers={approvedOrganizers.map((org) => ({
          id: org.id,
          brandName: org.brandName ?? org.user?.email ?? org.id,
          user: { name: org.user?.name ?? null, email: org.user?.email ?? "" },
        }))}
        defaultPromoterId={defaultPromoterId}
      />
    </div>
  );
}
