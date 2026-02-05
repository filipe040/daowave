import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountLegal from "../components/account-legal";

export const dynamic = "force-dynamic";

export default async function AccountLegalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return <AccountLegal />;
}
