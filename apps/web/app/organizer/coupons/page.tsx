import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PROMOTER") {
    redirect("/auth/signin");
  }

  const organizer = await prisma.promoterProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!organizer || organizer.status !== "APPROVED") {
    redirect("/organizer");
  }

  const events = await prisma.event.findMany({
    where: { promoterId: organizer.id },
    select: {
      id: true,
      title: true,
      slug: true,
      startAt: true,
    },
    orderBy: { startAt: "desc" },
  });

  // Try to fetch coupons, but handle case where table doesn't exist yet (migration not applied)
  type CouponWithEvent = {
    id: string;
    eventId: string;
    code: string;
    discountType: string;
    discountValue: number;
    maxUses: number | null;
    usedCount: number;
    isActive: boolean;
    startsAt: Date;
    endsAt: Date;
    createdAt: Date;
    updatedAt: Date;
    event: {
      id: string;
      title: string;
      slug: string;
      status: string;
    };
  };

  let coupons: CouponWithEvent[] = [];
  try {
    coupons = await prisma.coupon.findMany({
      where: {
        event: {
          promoterId: organizer.id,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error: any) {
    // If table doesn't exist (migration not applied), return empty array
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      console.warn("Coupon table not found. Please run Prisma migration.");
      coupons = [];
    } else {
      // Re-throw other errors
      throw error;
    }
  }

  return (
    <div className="space-y-6 md:space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Cupões de Desconto</h1>
          <p className="text-base md:text-lg text-zinc-500">Gerir cupões de desconto para os seus eventos</p>
        </div>
        <Link
          href="/organizer/coupons/new"
          className="bg-[#00a0e3] hover:bg-[#0090cc] px-6 py-3 md:px-8 md:py-4 rounded-xl text-base md:text-lg font-semibold transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 whitespace-nowrap hover:scale-105"
        >
          + Criar Cupão
        </Link>
      </div>

      {coupons.length > 0 ? (
        <div className="bg-neutral-100/60 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-lg">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">Código</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">Evento</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">Desconto</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">Utilizações</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">Estado</th>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-zinc-300">Validade</th>
                  <th className="px-8 py-4 text-right text-sm font-semibold text-zinc-300">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700/50">
                {coupons.map((coupon) => {
                  const now = new Date();
                  const startsAt = new Date(coupon.startsAt);
                  const endsAt = new Date(coupon.endsAt);
                  const isExpired = endsAt < now;
                  const isActive = coupon.isActive && startsAt <= now && endsAt >= now;
                  const isInactive = !coupon.isActive || startsAt > now || endsAt < now;
                const usageLimit = coupon.maxUses
                  ? `${coupon.usedCount}/${coupon.maxUses}`
                  : `${coupon.usedCount}/∞`;

                  return (
                    <tr key={coupon.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5">
                        <div className="font-mono font-bold text-lg text-purple-400">
                          {coupon.code}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <Link
                          href={coupon.event.status === "PUBLISHED" ? `/events/${coupon.event.slug}` : `/organizer/events/${coupon.event.id}/edit`}
                          className="hover:text-purple-400 transition-colors text-base"
                        >
                          {coupon.event.title}
                        </Link>
                      </td>
                      <td className="px-8 py-5">
                        {coupon.discountType === "PERCENTAGE" ? (
                          <span className="font-bold text-lg">{coupon.discountValue}%</span>
                        ) : (
                          <span className="font-bold text-lg">
                            {(coupon.discountValue / 100).toFixed(2)} €
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-base">{usageLimit}</td>
                      <td className="px-8 py-5">
                        {isExpired ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-600 border border-red-500/30">
                            Expirado
                          </span>
                        ) : !coupon.isActive ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            Inativo
                          </span>
                        ) : startsAt > now ? (
                          <span className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Agendado
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-base text-zinc-500">
                        {new Date(coupon.endsAt).toLocaleDateString("pt-PT")}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Link
                          href={`/organizer/coupons/${coupon.id}`}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium inline-flex items-center gap-1 group"
                        >
                          Editar
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-zinc-700/50">
            {coupons.map((coupon) => {
              const now = new Date();
              const startsAt = new Date(coupon.startsAt);
              const endsAt = new Date(coupon.endsAt);
              const isExpired = endsAt < now;
              const isActive = coupon.isActive && startsAt <= now && endsAt >= now;
                const usageLimit = coupon.maxUses
                  ? `${coupon.usedCount}/${coupon.maxUses}`
                  : `${coupon.usedCount}/∞`;

              return (
                <div key={coupon.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="font-mono font-bold text-lg text-purple-400">
                        {coupon.code}
                      </div>
                      <Link
                        href={coupon.event.status === "PUBLISHED" ? `/events/${coupon.event.slug}` : `/organizer/events/${coupon.event.id}/edit`}
                        className="text-base text-zinc-300 hover:text-purple-400 transition-colors block truncate"
                      >
                        {coupon.event.title}
                      </Link>
                    </div>
                    {isExpired ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-600 border border-red-500/30 ml-3 flex-shrink-0">
                        Expirado
                      </span>
                    ) : !coupon.isActive ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 ml-3 flex-shrink-0">
                        Inativo
                      </span>
                    ) : startsAt > now ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 ml-3 flex-shrink-0">
                        Agendado
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg text-xs bg-green-500/20 text-green-400 border border-green-500/30 ml-3 flex-shrink-0">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-zinc-500 mb-4">
                    <div>
                      <span className="text-zinc-500 font-medium">Desconto:</span>{" "}
                      {coupon.discountType === "PERCENTAGE" ? (
                        <span className="font-bold">{coupon.discountValue}%</span>
                      ) : (
                        <span className="font-bold">
                          {(coupon.discountValue / 100).toFixed(2)} €
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-500 font-medium">Usos:</span> {usageLimit}
                    </div>
                    <div className="col-span-2">
                      <span className="text-zinc-500 font-medium">Validade:</span>{" "}
                      {new Date(coupon.endsAt).toLocaleDateString("pt-PT")}
                    </div>
                  </div>
                  <Link
                    href={`/organizer/coupons/${coupon.id}`}
                    className="text-purple-400 hover:text-purple-300 text-sm font-medium block text-right flex items-center justify-end gap-1 group"
                  >
                    Editar
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-neutral-100/60 backdrop-blur-sm rounded-2xl border border-white/10 p-12 md:p-16 lg:p-20 text-center shadow-lg">
          <div className="mb-6 flex justify-center">
            <Ticket className="h-16 w-16 text-zinc-500" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold mb-3">Ainda não tem cupões</h3>
          <p className="text-base md:text-lg text-zinc-500 mb-8 max-w-md mx-auto">
            Crie o seu primeiro cupão de desconto para aumentar as vendas
          </p>
          <Link
            href="/organizer/coupons/new"
            className="inline-block bg-[#00a0e3] hover:bg-[#0090cc] px-8 py-4 rounded-xl text-base md:text-lg font-semibold transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105"
          >
            Criar Cupão
          </Link>
        </div>
      )}
    </div>
  );
}

