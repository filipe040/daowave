import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountTickets from "../components/account-tickets";
import { staffDashboardRedirectPath } from "@/lib/auth/public-nav";

export const dynamic = "force-dynamic";

export default async function AccountTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const staffRedirect = staffDashboardRedirectPath(session);
  if (staffRedirect) redirect(staffRedirect);
  return <AccountTickets />;
}
