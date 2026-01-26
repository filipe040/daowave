import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import AccountForm from "../components/account-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrganizerAccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?from=/organizer/account");
  }

  const organizerProfile = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          createdAt: true,
        },
      },
      events: {
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!organizerProfile) {
    redirect("/");
  }

  const stats = {
    totalEvents: await prisma.event.count({
      where: { promoterId: organizerProfile.id },
    }),
    publishedEvents: await prisma.event.count({
      where: { promoterId: organizerProfile.id, status: "PUBLISHED" },
    }),
    totalTickets: await prisma.ticket.count({
      where: {
        event: {
          promoterId: organizerProfile.id,
        },
      },
    }),
    totalRevenue: await prisma.order.aggregate({
      where: {
        event: {
          promoterId: organizerProfile.id,
        },
        status: "PAID",
      },
      _sum: {
        totalCents: true,
      },
    }),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold mb-2">Conta</h1>
        <p className="text-zinc-400">Gerir o seu perfil e configurações</p>
      </div>

      {/* Profile Info */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">Informações do Perfil</h2>
        <AccountForm
          organizerProfile={organizerProfile}
          user={organizerProfile.user}
        />
      </div>

      {/* Statistics */}
      <div className="grid sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Eventos</span>
            <span className="text-2xl">🎫</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {stats.publishedEvents} publicados
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Bilhetes</span>
            <span className="text-2xl">🎟️</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalTickets}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Receita</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {((stats.totalRevenue._sum.totalCents || 0) / 100).toFixed(2)} €
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Membro desde</span>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-sm font-bold text-white">
            {format(new Date(organizerProfile.user.createdAt), "MMM yyyy", { locale: pt })}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4">Estado da Conta</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Status do Perfil</span>
            <span
              className={`text-xs px-3 py-1 rounded font-semibold ${
                organizerProfile.status === "APPROVED"
                  ? "bg-green-500/20 text-green-400"
                  : organizerProfile.status === "PENDING"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {organizerProfile.status === "APPROVED"
                ? "Aprovado"
                : organizerProfile.status === "PENDING"
                ? "Pendente"
                : "Rejeitado"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Marca</span>
            <span className="text-sm font-medium">{organizerProfile.brandName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Email</span>
            <span className="text-sm font-medium">{organizerProfile.user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

