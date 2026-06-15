/**
 * /auth/callback
 *
 * Server-side role-based redirect page.
 * OAuth providers redirect to /auth/callback after successful signin.
 * We read the session here and redirect to the correct dashboard.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

export default async function AuthCallbackPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string }>;
}) {
    const { from } = await searchParams;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/auth/signin");
    }

    const role = (session.user as any).role as string | undefined;
    const requiresEmailUpdate = (session.user as any).requiresEmailUpdate === true;

    // Apple "Hide My Email" users → prompt them to update email first
    if (requiresEmailUpdate) {
        redirect("/account/profile?setup=email");
    }

    // Role-based redirect
    if (role === "ADMIN" || role === "FINANCE_MANAGER" || role === "SUPPORT_AGENT") redirect("/admin");
    if ((session.user as { hasOrgAccess?: boolean }).hasOrgAccess) redirect("/promotor");

    const safeFrom = safeRedirectPath(from, "/");
    if (safeFrom !== "/") {
        redirect(safeFrom);
    }

    redirect("/");
}
