/**
 * /auth/callback
 *
 * Server-side role-based redirect page.
 * OAuth providers redirect to /auth/callback after successful signin.
 * We read the session here and redirect to the correct dashboard.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AuthCallbackPage({
    searchParams,
}: {
    searchParams: { from?: string };
}) {
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
    if (role === "ADMIN") redirect("/admin");
    if (role === "PROMOTER") redirect("/promotor");

    // Default: go where they came from, fallback to home
    const from = searchParams?.from;
    if (from && from.startsWith("/") && !from.startsWith("/auth")) {
        redirect(from);
    }

    redirect("/");
}
