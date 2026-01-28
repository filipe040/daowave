import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { canAccessAdminArea, isPromoter } from "@/lib/auth/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  const role = (session.user as any).role;

  if (!canAccessAdminArea(role)) {
    // Redirecionar com base no role real
    if (isPromoter(role)) {
      redirect("/organizer");
    }

    if (role === "USER") {
      redirect("/validator");
    }

    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="text-xl font-bold text-purple-400">
              7even Tickets - Admin
            </Link>
            <nav className="flex gap-4">
              <Link
                href="/admin/users"
                className="px-3 py-2 rounded hover:bg-zinc-800 transition"
              >
                Utilizadores
              </Link>
              <Link
                href="/admin/organizers"
                className="px-3 py-2 rounded hover:bg-zinc-800 transition"
              >
                Promotores
              </Link>
              <Link
                href="/admin/events"
                className="px-3 py-2 rounded hover:bg-zinc-800 transition"
              >
                Eventos
              </Link>
              <Link
                href="/admin/events/pending"
                className="px-3 py-2 rounded hover:bg-zinc-800 transition"
              >
                Aprovar Eventos
              </Link>
              <Link
                href="/admin/events/new"
                className="px-3 py-2 rounded hover:bg-zinc-800 transition"
              >
                Criar Evento
              </Link>
              <Link
                href="/admin/payments"
                className="px-3 py-2 rounded hover:bg-zinc-800 transition"
              >
                Pagamentos
              </Link>
              <Link
                href="/admin/audit"
                className="px-3 py-2 rounded hover:bg-zinc-800 transition"
              >
                Auditoria
              </Link>
              <Link
                href="/"
                className="px-3 py-2 rounded hover:bg-zinc-800 transition"
              >
                Sair
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">{children}</main>
    </div>
  );
}

