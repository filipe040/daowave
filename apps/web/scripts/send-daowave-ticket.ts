import { PrismaClient, Role, OrganizerStatus, OrganizationStatus, EventStatus, TicketStatus, MemberRole, TicketTemplateStatus } from "@prisma/client";
import { EmailService, sendTicketsEmail } from "../lib/email-service";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Dão Wave ticket and invoice generation...");

    const recipientEmail = process.argv[2] || "vascomelo2005@gmail.com";
    console.log(`📧 Recipient: ${recipientEmail}`);

    const pw = await hash("password123", 10);

    // 1. Ensure Organization exists
    console.log("🏢 Ensuring Organization exists...");
    const org = await prisma.organization.upsert({
        where: { slug: "daowave" },
        update: {},
        create: {
            name: "Dão Wave",
            legalName: "Dão Wave Entertainment Lda",
            slug: "daowave",
            vatNumber: "PT500123456",
            status: OrganizationStatus.ACTIVE,
            contactEmail: "admin@daowave.pt",
            address: "Viseu, Portugal",
        }
    });

    // 2. Ensure User exists
    console.log("👤 Ensuring User exists...");
    const user = await prisma.user.upsert({
        where: { email: recipientEmail },
        update: {},
        create: {
            email: recipientEmail,
            name: "User Dão Wave",
            passwordHash: pw,
            role: Role.USER,
            emailVerified: true,
            onboardingComplete: true
        }
    });

    // 3. Ensure Event exists
    console.log("📅 Ensuring Event exists...");
    const promoter = await prisma.promoterProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            brandName: "Dão Wave",
            status: OrganizerStatus.APPROVED,
            contactEmail: recipientEmail,
        }
    });

    const event = await prisma.event.upsert({
        where: { slug: "daowave-2026" },
        update: {},
        create: {
            organizationId: org.id,
            promoterId: promoter.id,
            title: "Dão Wave 2026",
            slug: "daowave-2026",
            description: "O maior evento do Dão.",
            venue: "Solar do Vinho do Dão",
            city: "Viseu",
            startAt: new Date("2026-08-15T18:00:00Z"),
            endAt: new Date("2026-08-16T04:00:00Z"),
            status: EventStatus.PUBLISHED,
        }
    });

    // 4. Ensure Ticket Type and Lot exist
    console.log("🎫 Ensuring Ticket types exist...");
    const ticketType = await prisma.ticketType.create({
        data: {
            eventId: event.id,
            name: "Geral",
            description: "Acesso total ao evento",
        }
    });

    const lot = await prisma.ticketLot.create({
        data: {
            eventId: event.id,
            ticketTypeId: ticketType.id,
            name: "Lote 1",
            priceCents: 2500, // 25€
            quantityTotal: 100,
            saleStartAt: new Date(),
            saleEndAt: new Date("2026-08-15T00:00:00Z"),
        }
    });

    // 5. Create Order
    console.log("🛒 Creating Order...");
    const order = await prisma.order.create({
        data: {
            userId: user.id,
            eventId: event.id,
            totalCents: 2500,
            currency: "EUR",
            status: "PAID",
            paidAt: new Date(),
            buyerName: user.name,
            buyerEmail: user.email,
            items: {
                create: {
                    ticketLotId: lot.id,
                    quantity: 1,
                    unitPriceCents: 2500,
                }
            }
        }
    });

    // 6. Create Ticket
    console.log("🎫 Creating Ticket...");
    await prisma.ticket.create({
        data: {
            orderId: order.id,
            eventId: event.id,
            userId: user.id,
            ticketLotId: lot.id,
            code: `DW-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            qrPayload: `TICKET-${order.id}`,
            status: "VALID",
        }
    });

    // 7. Trigger Email
    console.log("✉️ Triggering ticket and invoice email...");
    await sendTicketsEmail(order.id);

    console.log("✅ Process completed!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
