import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ApproveRejectForm } from "./approve-reject-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerDetailPage({ params }: PageProps) {
  const { id } = await params;

  const organizer = await prisma.promoterProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
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
        take: 10,
      },
      _count: {
        select: {
          events: true,
        },
      },
    },
  });

  if (!organizer) {
    notFound();
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">{organizer.brandName}</h1>
        <p className="text-base md:text-lg text-zinc-400">Detalhes do promotor</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/50 shadow-lg">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">Informações</h2>
            <dl className="space-y-4 md:space-y-5">
              <div>
                <dt className="text-sm md:text-base text-zinc-400 mb-1">Email</dt>
                <dd className="text-base md:text-lg text-white font-medium">{organizer.user.email}</dd>
              </div>
              <div>
                <dt className="text-sm md:text-base text-zinc-400 mb-1">Nome</dt>
                <dd className="text-base md:text-lg text-white font-medium">{organizer.user.name || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm md:text-base text-zinc-400 mb-1">VAT Number</dt>
                <dd className="text-base md:text-lg text-white font-medium">{organizer.vatNumber || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm md:text-base text-zinc-400 mb-1">Status</dt>
                <dd>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium ${
                      organizer.status === "APPROVED"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : organizer.status === "REJECTED"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    }`}
                  >
                    {organizer.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Recent Events */}
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/50 shadow-lg">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">
              Eventos ({organizer._count.events})
            </h2>
            {organizer.events.length > 0 ? (
              <div className="space-y-3">
                {organizer.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 md:p-5 bg-zinc-900/50 rounded-xl border border-zinc-700/50 hover:bg-zinc-900/80 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-base md:text-lg mb-1">{event.title}</div>
                      <div className="text-sm md:text-base text-zinc-400">
                        {new Date(event.createdAt).toLocaleDateString("pt-PT")}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs md:text-sm ${
                        event.status === "PUBLISHED"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-zinc-700/50 text-zinc-400 border border-zinc-600/30"
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base md:text-lg text-zinc-400">Nenhum evento criado ainda</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-zinc-700/50 shadow-lg sticky top-4">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">Ações</h2>
            <ApproveRejectForm promoterId={id} currentStatus={organizer.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

