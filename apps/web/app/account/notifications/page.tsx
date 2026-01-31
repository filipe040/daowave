import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import AccountNotifications from "../components/account-notifications";

export const dynamic = "force-dynamic";

async function getNotificationPrefs(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        notifyEmail: true,
        notifyEventReminders: true,
        notifyTransfers: true,
        marketingOptIn: true,
      },
    });
    return user ?? { notifyEmail: true, notifyEventReminders: true, notifyTransfers: true, marketingOptIn: false };
  } catch {
    return { notifyEmail: true, notifyEventReminders: true, notifyTransfers: true, marketingOptIn: false };
  }
}

export default async function AccountNotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const prefs = await getNotificationPrefs(session.user.id);
  return <AccountNotifications initialPrefs={prefs} />;
}
