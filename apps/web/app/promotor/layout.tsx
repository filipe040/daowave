import { PromoterSidebar } from "@/components/promoter/PromoterSidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function PromoterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "PROMOTER" && role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <PromoterSidebar />
      </div>
      <main className="md:pl-72">
        {children}
      </main>
    </div>
  );
}
