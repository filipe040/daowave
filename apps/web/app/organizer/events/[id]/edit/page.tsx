import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EventForm from "../../components/event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user) {
    redirect(`/auth/signin?from=/organizer/events/${id}/edit`);
  }

  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizerProfile || organizerProfile.status !== "APPROVED") {
    redirect("/");
  }

  const event = await prisma.event.findUnique({
    where: { id },
  });

  if (!event) {
    notFound();
  }

  // Verify ownership
  if (event.promoterId !== organizerProfile.id && session.user.role !== "ADMIN") {
    redirect("/organizer/events");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Editar Evento</h1>
        <p className="text-zinc-400">{event.title}</p>
      </div>

      <EventForm eventId={id} initialData={event} />
    </div>
  );
}

