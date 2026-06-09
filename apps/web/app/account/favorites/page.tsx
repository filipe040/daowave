import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventFavoriteService } from "@/lib/services/event-favorite.service";
import AccountFavorites from "../components/account-favorites";

export const dynamic = "force-dynamic";

export default async function AccountFavoritesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const events = await EventFavoriteService.listForUser(session.user.id);

  return <AccountFavorites initialEvents={events} />;
}
