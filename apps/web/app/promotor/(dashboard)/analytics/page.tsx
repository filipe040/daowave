import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AnalyticsContent from "./components/analytics-content";

export const dynamic = "force-dynamic";

export default async function PromoterAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/promotor/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "PROMOTER" && role !== "ADMIN") redirect("/");

  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });
  const events =
    promoter || role === "ADMIN"
      ? await prisma.event.findMany({
          where: role === "PROMOTER" ? { promoterId: promoter!.id } : undefined,
          select: { id: true, title: true },
          orderBy: { startAt: "desc" },
          take: 50,
        })
      : [];

  return <AnalyticsContent events={events} />;
}
