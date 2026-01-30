import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Providers } from "../providers";
import { canAccessOrganizerArea, isAdmin, isPromoter } from "@/lib/auth/permissions";
import OrganizerDashboardShell from "./components/organizer-dashboard-shell";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?from=/organizer");
  }

  const role = (session.user as any).role;

  // Check if user is organizer (PROMOTER) or admin
  if (!canAccessOrganizerArea(role)) {
    redirect("/");
  }

  // Get organizer profile
  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // If no profile exists, allow ADMIN a read-only layout (sem perfil associado)
  if (!organizerProfile && isAdmin(role)) {
    // Admin can access but won't have a profile - handle in UI
  }

  // If organizer but no profile or not approved
  if (isPromoter(role) && (!organizerProfile || organizerProfile.status !== "APPROVED")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <div className="mb-6 text-6xl opacity-50">
              {!organizerProfile ? "📝" : organizerProfile.status === "PENDING" ? "⏳" : "❌"}
            </div>
            <h2 className="mb-2 text-2xl font-bold">
              {!organizerProfile
                ? "Perfil de Promotor Não Criado"
                : organizerProfile.status === "PENDING"
                ? "Aguardando Aprovação"
                : "Acesso Negado"}
            </h2>
            <p className="mb-6 text-zinc-400">
              {!organizerProfile
                ? "O seu perfil de promotor ainda não foi criado. Contacte o administrador."
                : organizerProfile.status === "PENDING"
                ? "O seu perfil está a aguardar aprovação. Será notificado quando for aprovado."
                : "O seu perfil foi rejeitado. Contacte o administrador para mais informações."}
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition-all hover:scale-105 hover:shadow-lg hover:shadow-white/20"
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Providers>
      <OrganizerDashboardShell
        organizerName={organizerProfile?.brandName || session.user.name || "Promotor"}
        userEmail={session.user.email || ""}
      >
        {children}
      </OrganizerDashboardShell>
    </Providers>
  );
}

