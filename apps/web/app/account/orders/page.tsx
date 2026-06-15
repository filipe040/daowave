import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountOrders from "../components/account-orders";
import { staffDashboardRedirectPath } from "@/lib/auth/public-nav";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const staffRedirect = staffDashboardRedirectPath(session);
  if (staffRedirect) redirect(staffRedirect);
  return <AccountOrders />;
}
