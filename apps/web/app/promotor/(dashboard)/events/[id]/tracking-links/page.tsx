import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import TrackingLinksContent from "./components/tracking-links-content";

export const dynamic = "force-dynamic";

export default async function EventTrackingLinksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/promotor/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "PROMOTER" && role !== "ADMIN") redirect("/");

  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });
  const event = promoter
    ? await prisma.event.findFirst({
        where: { id: eventId, promoterId: promoter.id },
        select: { id: true, title: true },
      })
    : role === "ADMIN"
    ? await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, title: true },
      })
    : null;

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Evento não encontrado.</p>
      </div>
    );
  }

  return <TrackingLinksContent eventId={event.id} eventTitle={event.title} />;
}
