import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import AccountTickets from "../components/account-tickets";

export const dynamic = "force-dynamic";

export default async function AccountTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return <AccountTickets />;
}
