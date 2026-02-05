import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountSecurity from "../components/account-security";

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return <AccountSecurity />;
}
