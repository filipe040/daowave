import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getAppBaseUrl } from "@/lib/company";
import { getPublicOrganizationBySlug } from "@/lib/organizations/public-profile";
import { EventCard } from "@/components/public/event-card";
import { toEventCardData } from "@/components/public/event-mappers";
import { SectionHeader } from "@/components/public/section-header";

export const dynamic = "force-dynamic";

const BASE_URL = getAppBaseUrl();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await getPublicOrganizationBySlug(slug);
  if (!org) {
    return { title: "Organização | LivePass", robots: { index: false, follow: false } };
  }

  const desc =
    org.publicBio?.slice(0, 160) ??
    `Próximos eventos de ${org.name}. Compra bilhetes na LivePass.`;
  const image = org.bannerUrl || org.logoUrl;

  return {
    title: `${org.name} — Eventos`,
    description: desc,
    openGraph: {
      title: org.name,
      description: desc,
      url: `${BASE_URL}/org/${slug}`,
      type: "profile",
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: org.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: org.name,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function OrganizationPublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getPublicOrganizationBySlug(slug);
  if (!org) notFound();

  const cards = org.events.map(toEventCardData);
  const banner = org.bannerUrl;
  const logo = org.logoUrl;

  return (
    <div className="public-shell min-h-screen bg-[#0c0c12]">
      {/* Banner */}
      <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-[#14141f]">
        {banner ? (
          <Image
            src={banner}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#14141f] to-[#0c0c12]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c12] via-[#0c0c12]/60 to-transparent" />
      </div>

      {/* Profile header */}
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-14 sm:-mt-16 flex flex-col items-center text-center pb-8 border-b border-white/[0.06]">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-[#0c0c12] bg-[#14141f] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {logo ? (
              <Image
                src={logo}
                alt={org.name}
                fill
                className="object-cover"
                sizes="128px"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#00a0e3]/30 to-[#14141f]">
                <span className="text-3xl font-black text-white/40">
                  {org.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <h1 className="mt-5 text-2xl sm:text-3xl font-black text-white tracking-tight">
            {org.name}
          </h1>

          {org.publicBio && (
            <p className="mt-3 max-w-xl text-sm sm:text-[15px] text-zinc-400 leading-relaxed">
              {org.publicBio}
            </p>
          )}

          {org.website && (
            <a
              href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#5ec8f8] hover:text-[#00a0e3] transition-colors"
            >
              <Globe className="h-4 w-4" />
              Website
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          )}
        </div>

        {/* Events */}
        <section className="py-10 sm:py-14">
          <SectionHeader title="Próximos eventos" subtitle={org.name} />
          {cards.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/[0.08] bg-[#14141f]/50 p-12 text-center">
              <p className="text-zinc-500 text-sm">
                Ainda não há eventos publicados. Volta em breve.
              </p>
              <Link
                href="/events"
                className="mt-4 inline-block text-sm font-bold text-[#00a0e3] hover:text-[#5ec8f8]"
              >
                Ver todos os eventos
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {cards.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
