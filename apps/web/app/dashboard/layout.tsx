import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardShell from "./components/shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?from=/dashboard");
  }

  const userRole = (session.user as { role?: string }).role;

  // Block USER role from accessing dashboard
  if (userRole === "USER") {
    redirect("/");
  }

  return <DashboardShell session={session}>{children}</DashboardShell>;
}
