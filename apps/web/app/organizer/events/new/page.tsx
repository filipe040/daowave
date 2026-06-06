import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Lightbulb } from "lucide-react";
import EventForm from "../components/event-form";

export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;
  const templateId = params.template;

  if (!session?.user) {
    redirect("/auth/signin?from=/organizer/events/new");
  }

  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizerProfile || organizerProfile.status !== "APPROVED") {
    redirect("/");
  }

  // Load template event if provided
  let templateData = null;
  if (templateId) {
    const templateEvent = await prisma.event.findUnique({
      where: {
        id: templateId,
        promoterId: organizerProfile.id,
      },
    });

    if (templateEvent) {
      templateData = templateEvent;
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {templateData ? `Criar Evento a partir de "${templateData.title}"` : "Criar Novo Evento"}
        </h1>
        <p className="text-neutral-500">
          {templateData
            ? "Ajuste os campos conforme necessário"
            : "Preencha todas as informações do evento"}
        </p>
      </div>

      {templateData && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 backdrop-blur-sm">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" strokeWidth={1.5} />
          <p className="text-sm text-blue-300">
            Usando evento &quot;{templateData.title}&quot; como template. Todos os campos foram preenchidos automaticamente.
          </p>
        </div>
      )}

      <EventForm initialData={templateData || undefined} />
    </div>
  );
}
