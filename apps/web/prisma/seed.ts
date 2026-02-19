import { PrismaClient, MemberRole, EventStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Users
  const passwordHash = await hash("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      passwordHash,
      role: "ADMIN",
    },
  });

  const promoterUser = await prisma.user.upsert({
    where: { email: "promoter@example.com" },
    update: {},
    create: {
      email: "promoter@example.com",
      name: "Promoter User",
      passwordHash,
      role: "PROMOTER",
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      email: "staff@example.com",
      name: "Staff User",
      passwordHash,
      role: "USER",
    },
  });

  // 2. Create Organization & Promoter Profile
  // We need a PromoterProfile for the Event relation (legacy/bridge)
  const promoterProfile = await prisma.promoterProfile.upsert({
    where: { userId: promoterUser.id },
    update: {},
    create: {
      userId: promoterUser.id,
      brandName: "Universal Music Demo",
      status: "APPROVED",
      contactEmail: "contact@universal.demo",
    }
  });

  const org = await prisma.organization.upsert({
    where: { slug: "universal-music" },
    update: {},
    create: {
      name: "Universal Music",
      slug: "universal-music",
      // ownerId removed (handled by members)
      members: {
        create: [
          { userId: promoterUser.id, role: MemberRole.OWNER },
          { userId: staffUser.id, role: MemberRole.STAFF }
        ]
      }
    },
  });

  // 3. Create Event
  const eventStart = new Date();
  eventStart.setDate(eventStart.getDate() + 30);
  const eventEnd = new Date(eventStart);
  eventEnd.setHours(eventEnd.getHours() + 4);

  const eventSlug = "festival-verao-2024-" + Date.now();

  const event = await prisma.event.create({
    data: {
      organizationId: org.id,
      promoterId: promoterProfile.id,
      title: "Festival de Verão 2024",
      slug: eventSlug,
      description: "O maior festival do ano.",
      venue: "Parque da Cidade",
      city: "Porto",
      startAt: eventStart,
      endAt: eventEnd,
      status: EventStatus.PUBLISHED,
      checkinMode: "SINGLE",
      // Removed maxEntries
      // Removed custom landing page fields
    },
  });

  // 4. Create Ticket Lot (TicketType)
  const lot = await prisma.ticketLot.create({
    data: {
      eventId: event.id,
      name: "Early Bird",
      priceCents: 2500,
      currency: "EUR",
      quantityTotal: 1000,
      quantitySold: 0,
      saleStartAt: new Date(),
      saleEndAt: eventStart,
      // active: true, // Removed from schema
    },
  });

  // 5. Create Orders & Tickets
  // Order 1: VIP (simulated using existing lot 'Early Bird' for simplicity, or create new lot)
  // Let's create a VIP lot first
  const vipLot = await prisma.ticketLot.create({
    data: {
      eventId: event.id,
      name: "VIP Pass",
      priceCents: 5000,
      currency: "EUR",
      quantityTotal: 100,
      quantitySold: 2,
      saleStartAt: new Date(),
      saleEndAt: eventStart,
      isActive: true,
    }
  });

  const buyerUser = await prisma.user.upsert({
    where: { email: "comprador@gmail.com" },
    update: {},
    create: {
      email: "comprador@gmail.com",
      name: "Carlos Comprador",
      passwordHash,
      role: "USER",
      emailVerified: true,
    },
  });

  const order1 = await prisma.order.create({
    data: {
      userId: buyerUser.id,
      eventId: event.id,
      totalCents: 10000, // 2 VIPs
      status: "PAID",
      items: {
        create: {
          ticketLotId: vipLot.id,
          quantity: 2,
          unitPriceCents: 5000
        }
      }
    }
  });

  await prisma.ticket.createMany({
    data: [
      {
        orderId: order1.id,
        eventId: event.id,
        userId: buyerUser.id,
        ticketLotId: vipLot.id,
        code: "VIP-1-" + Date.now(),
        qrPayload: "v1:VIP-1:demo:123:sign",
        status: "VALID"
      },
      {
        orderId: order1.id,
        eventId: event.id,
        userId: buyerUser.id,
        ticketLotId: vipLot.id,
        code: "VIP-2-" + Date.now(),
        qrPayload: "v1:VIP-2:demo:123:sign",
        status: "USED",
        checkedInAt: new Date(),
        checkedInByUserId: staffUser.id
      }
    ]
  });

  console.log({ adminUser, promoterUser, org, event, lot, vipLot, order1 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
