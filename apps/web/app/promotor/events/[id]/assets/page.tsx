import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import AssetsContent from "./components/assets-content";

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

  if (!event) {
    return null;
  }

  // Try to fetch assets (will fail gracefully if table doesn't exist)
  let assets: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    createdAt: Date;
  }> = [];

  try {
    assets = await prisma.eventAsset.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error: any) {
    // Table doesn't exist yet (migration not applied)
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      assets = [];
    } else {
      throw error;
    }
  }

  return { event, assets };
}

export default async function EventAssetsPage({
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

  const data = await getEventData(id, session.user.id);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Evento não encontrado.</p>
      </div>
    );
  }

  return <AssetsContent event={data.event} initialAssets={data.assets} />;
}
