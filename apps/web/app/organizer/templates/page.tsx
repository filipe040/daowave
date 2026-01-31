import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Calendar, CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizerTemplatesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?from=/organizer/templates");
  }

  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizerProfile || organizerProfile.status !== "APPROVED") {
    redirect("/");
  }

  // Get published events to use as templates
  const publishedEvents = await prisma.event.findMany({
    where: {
      promoterId: organizerProfile.id,
      status: "PUBLISHED",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      startAt: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Templates</h1>
        <p className="text-zinc-400">Use eventos anteriores como base para novos eventos</p>
      </div>

      {publishedEvents.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
          <div className="mb-4 flex justify-center">
          <FileText className="h-14 w-14 text-zinc-500" strokeWidth={1.5} />
        </div>
          <p className="text-lg text-zinc-400 mb-2">Ainda não há eventos publicados</p>
          <p className="text-sm text-zinc-500 mb-6">
            Os eventos publicados podem ser usados como templates para criar novos eventos rapidamente
          </p>
          <Link
            href="/organizer/events/new"
            className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/20"
          >
            Criar Primeiro Evento
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {publishedEvents.map((event) => (
            <Link
              key={event.id}
              href={`/organizer/events/new?template=${event.id}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm hover:border-zinc-700 hover:bg-zinc-900 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                    {event.title}
                  </h2>
                  <p className="text-sm text-zinc-400 mb-4">
                    Criado em {new Date(event.createdAt).toLocaleDateString("pt-PT")}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" strokeWidth={1.5} /> {new Date(event.startAt).toLocaleDateString("pt-PT")}</span>
                    <span className="inline-flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-emerald-500" strokeWidth={1.5} /> Publicado</span>
                  </div>
                </div>
                <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors ml-4">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold mb-2">Como usar Templates</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Clique num evento publicado para usar como base</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Todos os campos serão preenchidos automaticamente</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Pode editar e ajustar antes de criar o novo evento</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

