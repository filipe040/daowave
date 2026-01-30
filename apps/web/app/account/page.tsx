import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import AccountProfile from "./components/account-profile";

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
      },
    });

    return user;
  } catch (error: any) {
    // Fallback se avatarUrl ainda não existir na BD (ex.: migração não aplicada ou MySQL sem IF NOT EXISTS)
    const isMissingColumn =
      error?.code === "P2021" ||
      error?.message?.includes("Unknown column") ||
      error?.message?.includes("does not exist");
    if (isMissingColumn) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!user) return null;

      return { ...user, avatarUrl: null as string | null };
    }

    throw error;
  }
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/account");
  }

  const user = await getCurrentUser(session.user.id);

  if (!user) {
    redirect("/");
  }

  return <AccountProfile user={user} />;
}

