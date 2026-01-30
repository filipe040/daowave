import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { canAccessAdminArea, isPromoter } from "@/lib/auth/permissions";
import AdminDashboardShell from "./components/admin-dashboard-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  const role = (session.user as any).role;

  if (!canAccessAdminArea(role)) {
    if (isPromoter(role)) redirect("/organizer");
    if (role === "USER") redirect("/validator");
    redirect("/");
  }

  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}