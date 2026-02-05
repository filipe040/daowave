import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FinanceContent from "./components/finance-content";

export const dynamic = "force-dynamic";

export default async function PromoterFinancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/promotor/login");
  const role = (session.user as { role?: string }).role;
  if (role !== "PROMOTER" && role !== "ADMIN") redirect("/");

  const promoter = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!promoter && role !== "ADMIN") redirect("/");

  return <FinanceContent />;
}
