import * as Navigation from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessAdminArea, isPromoter } from "@/lib/auth/permissions";
import AdminSidebar from "./components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    Navigation.redirect("/auth/signin?callbackUrl=/admin");
  }

  const role = (session.user as any).role;

  if (!canAccessAdminArea(role)) {
    // Redirecionar com base no role real
    if (isPromoter(role)) {
      Navigation.redirect("/organizer");
    }

    if (role === "USER") {
      Navigation.redirect("/validator");
    }

    Navigation.redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminSidebar />
      <main className="ml-72 min-h-screen py-8 md:py-12">{children}</main>
    </div>
  );
}

