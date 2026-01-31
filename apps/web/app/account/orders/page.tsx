import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import AccountOrders from "../components/account-orders";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return <AccountOrders />;
}
