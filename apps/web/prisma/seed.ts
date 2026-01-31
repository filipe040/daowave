/**
 * Fase 2 — Seed de dados
 * 1 promotor, 2 eventos, 3 lotes de bilhetes, 1 cupom, ~20 bilhetes/orders
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createSignedQR } from "../lib/qr/hmac";

const prisma = new PrismaClient();

function generateTicketCode(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
}

async function main() {
  const defaultPassword = "TestPassword123!";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1 promotor (User PROMOTER + PromoterProfile APPROVED)
  const promoterUser = await prisma.user.upsert({
    where: { email: "promotor@seed.pt" },
    update: {},
    create: {
      email: "promotor@seed.pt",
      name: "Promotor Seed",
      passwordHash,
      role: "PROMOTER",
      emailVerified: true,
    },
  });

  const promoterProfile = await prisma.promoterProfile.upsert({
    where: { userId: promoterUser.id },
    update: {},
    create: {
      userId: promoterUser.id,
      brandName: "Bilheteira Seed",
      vatNumber: "PT123456789",
      status: "APPROVED",
      contactEmail: "promotor@seed.pt",
    },
  });

  // 2 eventos (PUBLISHED)
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const event1 = await prisma.event.upsert({
    where: { slug: "evento-seed-1" },
    update: {},
    create: {
      promoterId: promoterProfile.id,
      title: "Festival Seed 2025",
      slug: "evento-seed-1",
      description: "Evento de exemplo para desenvolvimento e testes.",
      venue: "Pavilhão Seed",
      city: "Lisboa",
      startAt: nextWeek,
      endAt: new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000),
      status: "PUBLISHED",
      bannerUrl: "https://i.imgur.com/placeholder.jpg",
    },
  });

  const event2 = await prisma.event.upsert({
    where: { slug: "evento-seed-2" },
    update: {},
    create: {
      promoterId: promoterProfile.id,
      title: "Concerto Acústico Seed",
      slug: "evento-seed-2",
      description: "Segundo evento de seed.",
      venue: "Auditório Seed",
      city: "Porto",
      startAt: nextMonth,
      endAt: new Date(nextMonth.getTime() + 2 * 60 * 60 * 1000),
      status: "PUBLISHED",
      bannerUrl: "https://i.imgur.com/placeholder2.jpg",
    },
  });

  // 3 lotes (2 no evento1, 1 no evento2) — IDs gerados por Prisma (UUID); idempotente por eventId+name
  const saleStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const saleEnd = new Date(nextMonth.getTime() + 24 * 60 * 60 * 1000);

  const lot1 =
    (await prisma.ticketLot.findFirst({
      where: { eventId: event1.id, name: "General" },
    })) ??
    (await prisma.ticketLot.create({
      data: {
        eventId: event1.id,
        name: "General",
        priceCents: 2500,
        currency: "EUR",
        quantityTotal: 100,
        quantitySold: 0,
        saleStartAt: saleStart,
        saleEndAt: saleEnd,
      },
    }));
  const lot2 =
    (await prisma.ticketLot.findFirst({
      where: { eventId: event1.id, name: "VIP" },
    })) ??
    (await prisma.ticketLot.create({
      data: {
        eventId: event1.id,
        name: "VIP",
        priceCents: 5000,
        currency: "EUR",
        quantityTotal: 20,
        quantitySold: 0,
        saleStartAt: saleStart,
        saleEndAt: saleEnd,
      },
    }));
  const lot3 =
    (await prisma.ticketLot.findFirst({
      where: { eventId: event2.id, name: "Único" },
    })) ??
    (await prisma.ticketLot.create({
      data: {
        eventId: event2.id,
        name: "Único",
        priceCents: 1500,
        currency: "EUR",
        quantityTotal: 50,
        quantitySold: 0,
        saleStartAt: saleStart,
        saleEndAt: saleEnd,
      },
    }));

  // 1 cupom para evento1
  await prisma.coupon.upsert({
    where: { code: "SEED10" },
    update: {},
    create: {
      eventId: event1.id,
      code: "SEED10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxUses: 100,
      usedCount: 0,
      isActive: true,
      startsAt: saleStart,
      endsAt: saleEnd,
    },
  });

  // Compradores (USER)
  const buyerEmails = [
    "comprador1@seed.pt",
    "comprador2@seed.pt",
    "comprador3@seed.pt",
    "comprador4@seed.pt",
    "comprador5@seed.pt",
  ];

  const buyers: { id: string }[] = [];
  for (const email of buyerEmails) {
    const u = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: email.replace("@seed.pt", ""),
        passwordHash,
        role: "USER",
        emailVerified: true,
      },
    });
    buyers.push({ id: u.id });
  }

  // Orders + Tickets (~20 bilhetes): várias encomendas PAID
  const ordersSpec: { userId: string; eventId: string; lotId: string; quantity: number }[] = [
    { userId: buyers[0].id, eventId: event1.id, lotId: lot1.id, quantity: 2 },
    { userId: buyers[0].id, eventId: event1.id, lotId: lot2.id, quantity: 1 },
    { userId: buyers[1].id, eventId: event1.id, lotId: lot1.id, quantity: 4 },
    { userId: buyers[2].id, eventId: event1.id, lotId: lot1.id, quantity: 3 },
    { userId: buyers[2].id, eventId: event2.id, lotId: lot3.id, quantity: 2 },
    { userId: buyers[3].id, eventId: event2.id, lotId: lot3.id, quantity: 5 },
    { userId: buyers[4].id, eventId: event1.id, lotId: lot1.id, quantity: 2 },
  ];

  for (const spec of ordersSpec) {
    const lot = await prisma.ticketLot.findUniqueOrThrow({ where: { id: spec.lotId } });
    const unitPriceCents = lot.priceCents;
    const totalCents = unitPriceCents * spec.quantity;

    const order = await prisma.order.create({
      data: {
        userId: spec.userId,
        eventId: spec.eventId,
        totalCents,
        currency: "EUR",
        status: "PAID",
        paymentProvider: "seed",
        paymentRef: `seed-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        ticketLotId: spec.lotId,
        quantity: spec.quantity,
        unitPriceCents,
      },
    });

    for (let i = 0; i < spec.quantity; i++) {
      const code = generateTicketCode();
      const ticket = await prisma.ticket.create({
        data: {
          orderId: order.id,
          eventId: spec.eventId,
          userId: spec.userId,
          ticketLotId: spec.lotId,
          code,
          qrPayload: "", // atualizado abaixo
        },
      });
      const qrPayload = createSignedQR({ ticketId: ticket.id, code });
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { qrPayload },
      });
    }

    await prisma.ticketLot.update({
      where: { id: spec.lotId },
      data: { quantitySold: { increment: spec.quantity } },
    });
  }

  // Opcional: 1 link de rastreio e 1 payout pendente (Fase 2 — tabelas podem não existir)
  try {
    await prisma.trackingLink.upsert({
      where: {
        eventId_code: { eventId: event1.id, code: "instagram" },
      },
      update: {},
      create: {
        eventId: event1.id,
        code: "instagram",
        label: "Instagram Stories",
      },
    });
  } catch {
    // Tabela TrackingLink pode não existir se a migration Fase 2 ainda não foi aplicada
  }

  try {
    const payoutCount = await prisma.payout.count();
    if (payoutCount === 0) {
      await prisma.payout.create({
        data: {
          promoterId: promoterProfile.id,
          amountCents: 50000,
          currency: "EUR",
          status: "PENDING",
        },
      });
    }
  } catch {
    // Tabela Payout pode não existir
  }

  console.log("Seed concluído: 1 promotor, 2 eventos, 3 lotes, 1 cupom, compradores e ~20 bilhetes.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
