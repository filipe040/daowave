import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountProfile from "../components/account-profile";

export const dynamic = "force-dynamic";

async function getCurrentUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        phone: true,
      },
    });
    return user;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    const isMissingColumn =
      err?.code === "P2021" ||
      err?.message?.includes("Unknown column") ||
      err?.message?.includes("does not exist");
    if (isMissingColumn) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!user) return null;
      return { ...user, avatarUrl: null as string | null, phone: null as string | null };
    }
    throw error;
  }
}

export default async function AccountProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/signin?callbackUrl=/account/profile");
  const user = await getCurrentUser(session.user.id);
  if (!user) redirect("/account");
  return <AccountProfile user={user} />;
}
