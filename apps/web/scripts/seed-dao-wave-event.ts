/**
 * Cria evento "Dão Wave" publicado com bilhetes para compra (pagamento mock).
 *
 * Na VPS:
 *   cd /var/www/daowave/apps/web
 *   npx ts-node -P tsconfig.seed.json scripts/seed-dao-wave-event.ts
 */

import {
  PrismaClient,
  EventStatus,
  OrganizationStatus,
  OrganizerStatus,
  TicketTypeStatus,
  TicketLotStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const saleEnd = new Date(now);
  saleEnd.setFullYear(saleEnd.getFullYear() + 1);

  const startAt = new Date(now);
  startAt.setDate(startAt.getDate() + 45);
  const endAt = new Date(startAt);
  endAt.setHours(endAt.getHours() + 8);

  const org = await prisma.organization.upsert({
    where: { slug: "daowave" },
    update: { status: OrganizationStatus.ACTIVE },
    create: {
      name: "DãoWave",
      slug: "daowave",
      status: OrganizationStatus.ACTIVE,
      contactEmail: "admin@daowave.pt",
    },
  });

  let promoter = await prisma.promoterProfile.findFirst({
    where: { status: OrganizerStatus.APPROVED },
  });

  if (!promoter) {
    const user =
      (await prisma.user.findFirst({ where: { role: "ADMIN" } })) ??
      (await prisma.user.findFirst());

    if (!user) {
      throw new Error(
        "Nenhum utilizador na base. Corre primeiro: npm run db:seed"
      );
    }

    promoter = await prisma.promoterProfile.upsert({
      where: { userId: user.id },
      update: { status: OrganizerStatus.APPROVED, brandName: "DãoWave" },
      create: {
        userId: user.id,
        brandName: "DãoWave",
        status: OrganizerStatus.APPROVED,
        contactEmail: user.email,
      },
    });
  }

  const event = await prisma.event.upsert({
    where: { slug: "dao-wave" },
    update: {
      title: "Dão Wave",
      status: EventStatus.PUBLISHED,
      archivedAt: null,
      organizationId: org.id,
      promoterId: promoter.id,
    },
    create: {
      organizationId: org.id,
      promoterId: promoter.id,
      title: "Dão Wave",
      slug: "dao-wave",
      description:
        "Festival Dão Wave — música, cultura e vinho. Bilhetes disponíveis para teste com pagamento mock.",
      venue: "Parque de Feiras de Viseu",
      city: "Viseu",
      startAt,
      endAt,
      status: EventStatus.PUBLISHED,
      coverImage: "https://picsum.photos/seed/daowave/1200/630",
      checkinMode: "SINGLE",
    },
  });

  let ticketType = await prisma.ticketType.findFirst({
    where: { eventId: event.id, name: "Geral" },
  });

  if (!ticketType) {
    ticketType = await prisma.ticketType.create({
      data: {
        eventId: event.id,
        name: "Geral",
        description: "Acesso geral ao festival",
        status: TicketTypeStatus.ACTIVE,
      },
    });
  }

  const lotData = {
    name: "Early Bird",
    description: "Lote promocional",
    priceCents: 2000,
    currency: "EUR",
    quantityTotal: 500,
    quantitySold: 0,
    capacity: 500,
    soldCount: 0,
    saleStartAt: now,
    saleEndAt: saleEnd,
    startsAt: now,
    endsAt: saleEnd,
    isActive: true,
    status: TicketLotStatus.ACTIVE,
    ticketTypeId: ticketType.id,
  };

  let lot = await prisma.ticketLot.findFirst({
    where: { eventId: event.id, name: "Early Bird" },
  });

  if (lot) {
    lot = await prisma.ticketLot.update({
      where: { id: lot.id },
      data: lotData,
    });
  } else {
    lot = await prisma.ticketLot.create({
      data: { eventId: event.id, ...lotData },
    });
  }

  console.log("\n✅ Evento Dão Wave criado/atualizado\n");
  console.log(`   Título:    ${event.title}`);
  console.log(`   Slug:      ${event.slug}`);
  console.log(`   ID:        ${event.id}`);
  console.log(`   Lote:      ${lot.name} — ${(lot.priceCents / 100).toFixed(2)} EUR (${lot.quantityTotal} bilhetes)`);
  console.log(`\n🌐 URL: https://tickets.daowave.pt/events/dao-wave`);
  console.log("\n📋 Para comprar em mock:");
  console.log("   1. .env: ENABLE_MOCK_PAYMENTS=true");
  console.log("   2. Conta USER (não promotor/admin) — regista em /auth/signup");
  console.log("   3. Abre o evento → seleciona bilhetes → checkout → pagamento mock");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
