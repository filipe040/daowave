import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessAdminPanel } from "@/lib/auth/admin-access";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/auth/signin");
    }

    const role = (session.user as { role?: string }).role;
    if (!canAccessAdminPanel(role)) {
        redirect("/");
    }

    return <AdminLayoutClient adminRole={role ?? "USER"}>{children}</AdminLayoutClient>;
}
