import { PrismaClient, MemberRole, EventStatus, TicketStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}
function addHours(d: Date, hours: number) {
  const r = new Date(d);
  r.setHours(r.getHours() + hours);
  return r;
}

async function main() {
  console.log("🌱 A fazer seed da base de dados...");
  const now = new Date();
  const pw = await hash("password123", 10);

  // ── USERS ────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@daowave.pt" },
    update: {},
    create: { email: "admin@daowave.pt", name: "Admin Daowave", passwordHash: pw, role: "ADMIN", emailVerified: true },
  });

  const promoter = await prisma.user.upsert({
    where: { email: "promotor@daowave.pt" },
    update: {},
    create: { email: "promotor@daowave.pt", name: "Sound Republic", passwordHash: pw, role: "PROMOTER", emailVerified: true },
  });

  const validator1 = await prisma.user.upsert({
    where: { email: "porteiro@daowave.pt" },
    update: {},
    create: { email: "porteiro@daowave.pt", name: "João Porteiro", passwordHash: pw, role: "VALIDATOR", emailVerified: true },
  });

  const buyers = await Promise.all(
    [
      { email: "ana.silva@gmail.com", name: "Ana Silva" },
      { email: "miguel.costa@gmail.com", name: "Miguel Costa" },
      { email: "sofia.martins@gmail.com", name: "Sofia Martins" },
      { email: "rui.ferreira@gmail.com", name: "Rui Ferreira" },
      { email: "ines.carvalho@gmail.com", name: "Inês Carvalho" },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash: pw, role: "USER", emailVerified: true },
      })
    )
  );

  // ── ORG ──────────────────────────────────────────────────────────────────
  const profile = await prisma.promoterProfile.upsert({
    where: { userId: promoter.id },
    update: {},
    create: { userId: promoter.id, brandName: "Sound Republic", status: "APPROVED", contactEmail: "sound@republic.pt" },
  });

  const org = await prisma.organization.upsert({
    where: { slug: "sound-republic" },
    update: {},
    create: {
      name: "Sound Republic",
      slug: "sound-republic",
      members: {
        create: [
          { userId: promoter.id, role: MemberRole.OWNER },
          { userId: validator1.id, role: MemberRole.STAFF },
        ],
      },
    },
  });

  // ── EVENTS ────────────────────────────────────────────────────────────────
  const EVENTS = [
    {
      title: "Noite Eletrónica — Lisboa",
      slug: "noite-eletronica-lisboa-2025",
      description:
        "A maior noite de música eletrónica do ano regressa ao coração de Lisboa. Três palcos, 12 DJs internacionais e uma produção de luz e som sem precedentes. Não percas.",
      venue: "Altice Arena",
      city: "Lisboa",
      startAt: addDays(now, 35),
      coverImage: "https://picsum.photos/seed/lisboa-elec/800/450",
      priceCents: 1800,
    },
    {
      title: "Festival Beira Rio — Porto",
      slug: "festival-beira-rio-porto-2025",
      description:
        "Três dias de música ao vivo às margens do Douro. Pop, indie e world music num cenário inesquecível junto à Ribeira do Porto.",
      venue: "Parque da Ribeira",
      city: "Porto",
      startAt: addDays(now, 60),
      coverImage: "https://picsum.photos/seed/porto-festival/800/450",
      priceCents: 1200,
    },
    {
      title: "Braga Rock Night",
      slug: "braga-rock-night-2025",
      description:
        "Rock alternativo e metal numa noite épica no centro histórico de Braga. Bandas nacionais e internacionais em palco até de madrugada.",
      venue: "Theatro Circo",
      city: "Braga",
      startAt: addDays(now, 90),
      coverImage: "https://picsum.photos/seed/braga-rock/800/450",
      priceCents: 1500,
    },
  ];

  const createdEvents = [];

  for (const ev of EVENTS) {
    const startAt = ev.startAt;
    const endAt = addHours(startAt, 6);
    const saleEnd = addDays(startAt, -1);

    const existing = await prisma.event.findUnique({ where: { slug: ev.slug } });
    if (existing) {
      createdEvents.push(existing);
      console.log(`⏭️  evento já existe: ${ev.slug}`);
      continue;
    }

    const event = await prisma.event.create({
      data: {
        organizationId: org.id,
        promoterId: profile.id,
        title: ev.title,
        slug: ev.slug,
        description: ev.description,
        venue: ev.venue,
        city: ev.city,
        startAt,
        endAt,
        status: EventStatus.PUBLISHED,
        checkinMode: "SINGLE",
        coverImage: ev.coverImage,
      },
    });

    // 5 ticket tiers per event
    const TIERS = [
      { name: "Early Bird", priceCents: ev.priceCents, qty: 200, sold: 180 },
      { name: "Normal", priceCents: Math.round(ev.priceCents * 1.4), qty: 500, sold: 200 },
      { name: "VIP", priceCents: Math.round(ev.priceCents * 2.5), qty: 100, sold: 40 },
      { name: "Late Bird", priceCents: Math.round(ev.priceCents * 1.7), qty: 300, sold: 50 },
      { name: "Mesa VIP", priceCents: Math.round(ev.priceCents * 4), qty: 20, sold: 8 },
    ];

    const lots = [];
    for (const tier of TIERS) {
      const lot = await prisma.ticketLot.create({
        data: {
          eventId: event.id,
          name: tier.name,
          priceCents: tier.priceCents,
          currency: "EUR",
          quantityTotal: tier.qty,
          quantitySold: tier.sold,
          saleStartAt: now,
          saleEndAt: saleEnd,
          isActive: true,
        },
      });
      lots.push({ ...lot, soldTarget: tier.sold });
    }

    // ~50 tickets per event across buyers
    let ticketIndex = 0;
    for (const lot of lots) {
      const numOrders = Math.min(lot.soldTarget, 3); // up to 3 orders per lot
      for (let o = 0; o < numOrders; o++) {
        const buyer = buyers[ticketIndex % buyers.length];
        ticketIndex++;
        const qty = Math.min(Math.ceil(lot.soldTarget / numOrders), 5);
        const order = await prisma.order.create({
          data: {
            userId: buyer.id,
            eventId: event.id,
            totalCents: lot.priceCents * qty,
            status: "PAID",
            items: {
              create: { ticketLotId: lot.id, quantity: qty, unitPriceCents: lot.priceCents },
            },
          },
        });

        const ticketData = Array.from({ length: qty }, (_, i) => ({
          orderId: order.id,
          eventId: event.id,
          userId: buyer.id,
          ticketLotId: lot.id,
          code: `${ev.slug.slice(0, 6).toUpperCase()}-${lot.name.slice(0, 2).toUpperCase()}-${Date.now()}-${o}-${i}`,
          qrPayload: `v1:${event.id}:${buyer.id}:${Date.now()}:seed`,
          status: o === 0 && i === 0 ? TicketStatus.USED : TicketStatus.VALID,
          ...(o === 0 && i === 0 ? { checkedInAt: new Date(), checkedInByUserId: validator1.id } : {}),
        }));

        await prisma.ticket.createMany({ data: ticketData });
      }
    }

    createdEvents.push(event);
    console.log(`✅ Evento criado: ${event.title} (${event.city})`);
  }

  const totalTickets = await prisma.ticket.count();
  const totalEvents = await prisma.event.count({ where: { status: "PUBLISHED" } });
  console.log(`\n🎟️  ${totalTickets} bilhetes | 🎪 ${totalEvents} eventos | 👥 ${buyers.length} compradores`);
  console.log("\n📧 Credenciais de acesso:");
  console.log("  admin@daowave.pt / password123  (ADMIN)");
  console.log("  promotor@daowave.pt / password123  (PROMOTER)");
  console.log("  ana.silva@gmail.com / password123  (USER — com bilhetes)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
