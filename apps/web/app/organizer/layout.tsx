import { redirect } from "next/navigation";

/** Layout legado — /organizer redireciona para /promotor no middleware. */
export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  redirect("/promotor");
}
