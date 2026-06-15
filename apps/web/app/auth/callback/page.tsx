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
import { getStaffDashboardPath } from "@/lib/auth/public-nav";
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

    const role = (session.user as { role?: string }).role;
    const hasOrgAccess =
      (session.user as { hasOrgAccess?: boolean }).hasOrgAccess === true;
    const requiresEmailUpdate =
      (session.user as { requiresEmailUpdate?: boolean }).requiresEmailUpdate === true;

    // Apple "Hide My Email" users → prompt them to update email first
    if (requiresEmailUpdate) {
        const staffPath = getStaffDashboardPath(role, hasOrgAccess);
        if (staffPath) {
          redirect("/account/security?setup=email");
        }
        redirect("/account/profile?setup=email");
    }

    const staffPath = getStaffDashboardPath(role, hasOrgAccess);
    if (staffPath) redirect(staffPath);

    const safeFrom = safeRedirectPath(from, "/");
    if (safeFrom !== "/") {
        redirect(safeFrom);
    }

    redirect("/");
}
