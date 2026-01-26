/**
 * Seed Script - Clean Implementation
 * Creates sample data for testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin:', admin.email);

  // Create Promoter
  const promoterPassword = await bcrypt.hash('promoter123', 10);
  const promoterUser = await prisma.user.upsert({
    where: { email: 'promoter@example.com' },
    update: {},
    create: {
      email: 'promoter@example.com',
      name: 'Promoter User',
      passwordHash: promoterPassword,
      role: 'PROMOTER',
    },
  });

  const promoter = await prisma.promoterProfile.upsert({
    where: { userId: promoterUser.id },
    update: {},
    create: {
      userId: promoterUser.id,
      brandName: 'Eventos PT Lda',
      vatNumber: 'PT123456789',
      contactEmail: 'promoter@example.com',
    },
  });
  console.log('✅ Created promoter:', promoter.brandName);

  // Create Regular User
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      passwordHash: userPassword,
      role: 'USER',
    },
  });
  console.log('✅ Created user:', user.email);

  // Create Events (using future dates)
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthPlus1 = new Date(now);
  nextMonthPlus1.setMonth(nextMonthPlus1.getMonth() + 2);
  const nextMonthPlus2 = new Date(now);
  nextMonthPlus2.setMonth(nextMonthPlus2.getMonth() + 3);

  const event1 = await prisma.event.upsert({
    where: { slug: 'concerto-rock-porto' },
    update: {},
    create: {
      promoterId: promoter.id,
      title: 'Concerto Rock no Porto',
      slug: 'concerto-rock-porto',
      description: 'Um concerto épico com as melhores bandas de rock do país. Não perca!',
      venue: 'Pavilhão Rosa Mota',
      city: 'Porto',
      startAt: new Date(nextMonth.getTime() + 15 * 24 * 60 * 60 * 1000), // +15 days
      endAt: new Date(nextMonth.getTime() + 15 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // +3 hours
      coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      status: 'PUBLISHED',
    },
  });
  console.log('✅ Created event:', event1.title);

  const event2 = await prisma.event.upsert({
    where: { slug: 'festival-musica-lisboa' },
    update: {},
    create: {
      promoterId: promoter.id,
      title: 'Festival de Música em Lisboa',
      slug: 'festival-musica-lisboa',
      description: 'Festival de música ao ar livre com vários artistas nacionais e internacionais.',
      venue: 'Parque Eduardo VII',
      city: 'Lisboa',
      startAt: new Date(nextMonthPlus1.getTime() + 20 * 24 * 60 * 60 * 1000), // +20 days
      endAt: new Date(nextMonthPlus1.getTime() + 20 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // +5 hours
      coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      status: 'PUBLISHED',
    },
  });
  console.log('✅ Created event:', event2.title);

  const event3 = await prisma.event.upsert({
    where: { slug: 'workshop-tecnologia' },
    update: {},
    create: {
      promoterId: promoter.id,
      title: 'Workshop de Tecnologia',
      slug: 'workshop-tecnologia',
      description: 'Workshop sobre as últimas tendências em tecnologia e desenvolvimento.',
      venue: 'Centro de Convenções',
      city: 'Braga',
      startAt: new Date(nextMonthPlus2.getTime() + 10 * 24 * 60 * 60 * 1000), // +10 days
      endAt: new Date(nextMonthPlus2.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // +4 hours
      coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
      status: 'DRAFT',
    },
  });
  console.log('✅ Created event (draft):', event3.title);

  // Create Ticket Lots (with future sale dates)
  // Sale starts 7 days ago (already active) and ends 1 day before the event
  const saleStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago (already started)
  const saleEnd1 = new Date(event1.startAt.getTime() - 24 * 60 * 60 * 1000); // 1 day before event1
  const saleEnd2 = new Date(event2.startAt.getTime() - 24 * 60 * 60 * 1000); // 1 day before event2
  
  // Ensure saleEnd is in the future (at least 1 day from now)
  const minSaleEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
  const finalSaleEnd1 = saleEnd1 > minSaleEnd ? saleEnd1 : minSaleEnd;
  const finalSaleEnd2 = saleEnd2 > minSaleEnd ? saleEnd2 : minSaleEnd;

  const lot1 = await prisma.ticketLot.create({
    data: {
      eventId: event1.id,
      name: 'Bilhete Geral',
      priceCents: 2500, // €25.00
      currency: 'EUR',
      quantityTotal: 100,
      quantitySold: 15,
      saleStartAt: saleStart,
      saleEndAt: finalSaleEnd1,
    },
  });

  const lot2 = await prisma.ticketLot.create({
    data: {
      eventId: event1.id,
      name: 'Bilhete VIP',
      priceCents: 5000, // €50.00
      currency: 'EUR',
      quantityTotal: 50,
      quantitySold: 5,
      saleStartAt: saleStart,
      saleEndAt: finalSaleEnd1,
    },
  });

  const lot3 = await prisma.ticketLot.create({
    data: {
      eventId: event2.id,
      name: 'Bilhete Único',
      priceCents: 3000, // €30.00
      currency: 'EUR',
      quantityTotal: 200,
      quantitySold: 30,
      saleStartAt: saleStart,
      saleEndAt: finalSaleEnd2,
    },
  });

  console.log('✅ Created ticket lots');

  // Create Sample Order and Tickets
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      eventId: event1.id,
      totalCents: 5000,
      currency: 'EUR',
      status: 'PAID',
      paymentProvider: 'mock',
      paymentRef: 'mock_payment_123',
      items: {
        create: [
          {
            ticketLotId: lot1.id,
            quantity: 2,
            unitPriceCents: 2500,
          },
        ],
      },
    },
  });

  // Create sample tickets
  for (let i = 0; i < 2; i++) {
    await prisma.ticket.create({
      data: {
        orderId: order.id,
        eventId: event1.id,
        userId: user.id,
        ticketLotId: lot1.id,
        code: `TKT-${Date.now()}-${i}`,
        qrPayload: `mock_qr_${i}`,
      },
    });
  }

  console.log('✅ Created sample order and tickets');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Login credentials:');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  Promoter: promoter@example.com / promoter123');
  console.log('  User: user@example.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
