import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Admin root: tudo está no dashboard promotor; redirecionar para /promotor */
export default function AdminPage() {
  redirect("/promotor");
}
