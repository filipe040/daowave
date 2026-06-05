const { PrismaClient } = require("@prisma/client");
const { Resend } = require("resend");
const PDFDocument = require("pdfkit");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

async function generateTicketPDF(ticket, event) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        doc.fontSize(24).text(event.title, { align: "center" });
        doc.moveDown();
        doc.fontSize(16).text("BILHETE DIGITAL", { align: "center" });
        doc.moveDown(2);
        
        doc.fontSize(14).text(`Código: ${ticket.code}`);
        doc.text(`Participante: ${ticket.attendeeName}`);
        doc.text(`Data: ${new Date(event.startAt).toLocaleString("pt-PT")}`);
        doc.text(`Local: ${event.venue}, ${event.city}`);
        doc.moveDown(2);
        
        doc.fontSize(10).text("Apresente este documento na entrada do evento.", { align: "center" });
        doc.end();
    });
}

// Minimal invoice generation (text-based for now if playwright is hard to trigger from script)
async function generateInvoiceText(order, event) {
    return Buffer.from(`
        FATURA / RECIBO
        ----------------
        Evento: ${event.title}
        Ordem ID: ${order.id}
        Data: ${new Date().toLocaleDateString("pt-PT")}
        Total: ${(order.totalCents / 100).toFixed(2)} EUR
        Comprador: ${order.buyerName} (${order.buyerEmail})
        ----------------
        Obrigado pela sua compra!
    `, "utf-8");
}

async function main() {
    console.log("🚀 Starting Dão Wave ticket and invoice generation...");

    const recipientEmail = process.argv[2] || "vascomelo2005@gmail.com";
    console.log(`📧 Recipient: ${recipientEmail}`);

    if (!process.env.RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY not found in environment");
        process.exit(1);
    }

    const pw = await hash("password123", 10);

    // 1. Ensure Organization
    const org = await prisma.organization.upsert({
        where: { slug: "daowave" },
        update: {},
        create: {
            name: "Dão Wave",
            slug: "daowave",
            status: "ACTIVE",
            contactEmail: "admin@daowave.pt",
        }
    });

    // 2. Ensure User
    const user = await prisma.user.upsert({
        where: { email: recipientEmail },
        update: {},
        create: {
            email: recipientEmail,
            name: "User Dão Wave",
            passwordHash: pw,
            role: "USER",
            emailVerified: true,
        }
    });

    // 3. Ensure Promoter & Event
    const promoter = await prisma.promoterProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
            userId: user.id,
            brandName: "Dão Wave",
            status: "APPROVED",
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
            status: "PUBLISHED",
        }
    });

    // 4. Ticket Type & Lot
    const ticketType = await prisma.ticketType.create({
        data: {
            eventId: event.id,
            name: "Geral",
        }
    });

    const lot = await prisma.ticketLot.create({
        data: {
            eventId: event.id,
            ticketTypeId: ticketType.id,
            name: "Lote 1",
            priceCents: 2500,
            quantityTotal: 100,
            saleStartAt: new Date(),
            saleEndAt: new Date("2026-08-15T00:00:00Z"),
        }
    });

    // 5. Order & Ticket
    const order = await prisma.order.create({
        data: {
            userId: user.id,
            eventId: event.id,
            totalCents: 2500,
            status: "PAID",
            buyerName: user.name,
            buyerEmail: user.email,
        }
    });

    const ticket = await prisma.ticket.create({
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

    // 6. Generate Attachments
    console.log("📄 Generating PDFs...");
    const ticketPdf = await generateTicketPDF(ticket, event);
    const invoicePdf = await generateInvoiceText(order, event);

    // 7. Send Email via Resend
    console.log("✉️ Sending email via Resend...");
    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "Dão Wave <no-reply@daowave.pt>",
        to: [recipientEmail],
        subject: `Os seus bilhetes para ${event.title}`,
        html: `
            <h1>🎫 Bilhetes Confirmados!</h1>
            <p>Olá ${user.name},</p>
            <p>Obrigado pela sua compra para o evento <strong>${event.title}</strong>.</p>
            <p>Em anexo encontrará o seu bilhete e a fatura correspondente.</p>
            <p>Vemo-nos em ${event.city}!</p>
        `,
        attachments: [
            {
                filename: `bilhete-${ticket.code}.pdf`,
                content: ticketPdf,
            },
            {
                filename: `fatura-${order.id.substring(0, 8)}.pdf`,
                content: invoicePdf,
            }
        ]
    });

    if (error) {
        console.error("❌ Error sending email:", error);
    } else {
        console.log("✅ Email sent successfully!", data.id);
    }

    console.log("✅ Process completed!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
