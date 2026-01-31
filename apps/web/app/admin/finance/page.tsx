import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import FinanceContent from "./components/finance-content";

export const dynamic = "force-dynamic";

export default async function AdminFinancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/admin/finance");
  }
  return <FinanceContent />;
}
