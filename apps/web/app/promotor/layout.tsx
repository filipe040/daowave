import { PromoterLayoutClient } from "@/components/promoter/PromoterLayoutClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PromoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "PROMOTER" && role !== "ADMIN") {
    redirect("/");
  }

  // Redirect legacy /promotor paths to /organizer
  redirect("/organizer");

  return <PromoterLayoutClient>{children}</PromoterLayoutClient>;
}
