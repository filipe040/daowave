import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import OrgSettingsForm from "../components/org-settings-form";

export const dynamic = "force-dynamic";

export default async function OrganizerSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin?from=/organizer/settings");
  }

  // Find the organization the user belongs to
  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!member?.organization) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Configurações da Organização</h1>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-600">
          <p className="font-semibold mb-1">Sem organização associada</p>
          <p className="text-sm">A sua conta ainda não está ligada a nenhuma organização. Contacte o suporte para criar a sua organização.</p>
        </div>
      </div>
    );
  }

  const org = member.organization;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Configurações da Organização</h1>
        </div>
        <p className="text-sm text-neutral-500 ml-11">Gerir os dados públicos e fiscais da sua organização</p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white backdrop-blur-sm p-6 sm:p-8">
        <OrgSettingsForm organization={org as any} />
      </div>
    </div>
  );
}
