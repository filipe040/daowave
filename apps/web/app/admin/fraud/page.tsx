import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FraudContent from "./components/fraud-content";

export const dynamic = "force-dynamic";

export default async function AdminFraudPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/auth/signin?callbackUrl=/admin/fraud");
  }
  return <FraudContent />;
}
