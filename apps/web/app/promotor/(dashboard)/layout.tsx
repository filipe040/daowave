import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessPromoterArea } from "@/lib/auth/permissions";
import DashboardShell from "../components/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (err) {
    console.error("[promotor/dashboard] layout getServerSession error:", err);
    redirect("/promotor/login");
  }

  if (!session?.user) {
    redirect("/promotor/login");
  }

  const role = (session.user as { role?: string }).role;
  if (!canAccessPromoterArea(role)) {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
