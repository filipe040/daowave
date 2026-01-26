const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Procurando bilhetes no banco de dados...\n");

  // Buscar um bilhete existente que ainda não foi usado
  let ticket = await prisma.ticket.findFirst({
    where: {
      status: "ISSUED",
      entriesUsed: 0, // Not checked in yet
    },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
      holder: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!ticket) {
    console.log("❌ Nenhum bilhete encontrado!");
    console.log("💡 Criando bilhete de teste...\n");
    
    // Tentar criar um bilhete de teste se houver um evento
    const event = await prisma.event.findFirst({
      where: { status: "PUBLISHED" },
      include: {
        ticketTypes: {
          include: {
            lots: true,
          },
        },
      },
    });

    if (!event || event.ticketTypes.length === 0) {
      console.log("❌ Nenhum evento com tipos de bilhete encontrado.");
      console.log("💡 Execute 'npm run db:seed' primeiro.\n");
      process.exit(1);
    }

    // Criar uma ordem de teste
    const user = await prisma.user.findFirst({
      where: { role: "USER" },
    });

    if (!user) {
      console.log("❌ Nenhum usuário USER encontrado.");
      console.log("💡 Execute 'npm run db:seed' primeiro.\n");
      process.exit(1);
    }

    const ticketType = event.ticketTypes[0];
    const lot = ticketType.lots[0];

    // Criar ordem
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        eventId: event.id,
        total: lot.price,
        currency: "EUR",
        status: "PAID",
        paidAt: new Date(),
        items: {
          create: {
            ticketLotId: lot.id,
            qty: 1,
            unitPrice: lot.price,
          },
        },
      },
    });

    // Criar bilhete (nominal)
    const { generateQrNonce } = require("../../lib/qr");
    const qrNonce = generateQrNonce();
    ticket = await prisma.ticket.create({
      data: {
        eventId: event.id,
        orderId: order.id,
        ticketTypeId: ticketType.id,
        ticketLotId: lot.id,
        holderUserId: user.id,
        attendeeName: user.name || "Attendee Test",
        attendeeEmail: user.email,
        status: "ISSUED",
        qrNonce,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        holder: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    console.log("✅ Bilhete de teste criado!\n");
  }

  // Gerar token QR
  const { generateQrToken } = require("../../lib/qr");
  const qrToken = generateQrToken(ticket.id, ticket.event.id, ticket.qrNonce);

  console.log("=".repeat(60));
  console.log("🎫 CÓDIGO DO BILHETE PARA TESTAR NO VALIDATOR");
  console.log("=".repeat(60));
  console.log("\n📋 Informações do Bilhete:");
  console.log(`   Evento: ${ticket.event.title}`);
  console.log(`   ID: ${ticket.id}`);
  console.log(`   Status: ${ticket.status}`);
  console.log(`   Entradas utilizadas: ${ticket.entriesUsed || 0}`);
  console.log(`   Participante: ${ticket.attendeeName} (${ticket.attendeeEmail})`);
  console.log(`   Proprietário: ${ticket.holder.name || ticket.holder.email}`);
  if (ticket.lastCheckinAt) {
    console.log(`   Último check-in: ${ticket.lastCheckinAt}`);
  }
  console.log("\n🔑 Token QR Code:");
  console.log(`   ${qrToken}`);
  console.log("\n" + "=".repeat(60));
  console.log("💡 Copie o token acima e cole no validator em /validator");
  console.log("=".repeat(60) + "\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });