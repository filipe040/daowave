import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TicketManagement from "./components/ticket-management";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventTicketsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user) {
    redirect(`/auth/signin?from=/organizer/events/${id}/tickets`);
  }

  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizerProfile || organizerProfile.status !== "APPROVED") {
    redirect("/");
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ticketLots: {
        orderBy: { saleStartAt: "asc" },
      },
    },
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
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/organizer/events"
            className="text-purple-400 hover:text-purple-300 transition-colors inline-flex items-center gap-2 group mb-4"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Voltar para Eventos
          </Link>
          <h1 className="text-3xl font-bold mb-2">Gerir Bilhetes</h1>
          <p className="text-neutral-500">{event.title}</p>
        </div>
      </div>

      <TicketManagement eventId={id} event={event} />
    </div>
  );
}

