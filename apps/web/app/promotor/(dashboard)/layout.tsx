import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { canAccessPromoterArea } from "@/lib/auth/permissions";
import DashboardShell from "../components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/promotor/login");
  }

  const role = (session.user as { role?: string }).role;
  if (!canAccessPromoterArea(role)) {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
