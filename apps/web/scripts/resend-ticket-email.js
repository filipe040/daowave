const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Import sendTicketsEmail - we'll need to use a workaround since it's TypeScript
async function sendTicketsEmailManually(orderId, recipientEmail) {
  const nodemailer = require("nodemailer");
  const PDFDocument = require("pdfkit");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Fetch order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      event: true,
      tickets: {
        include: {
          event: true,
          ticketLot: {
            include: {
              ticketType: true,
            },
          },
        },
      },
    },
  });

  if (!order || !order.tickets || order.tickets.length === 0) {
    throw new Error("Order or tickets not found");
  }

  // Generate PDFs (simplified version)
  const attachments = [];
  for (const ticket of order.tickets) {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    
    doc.on("data", (chunk) => chunks.push(chunk));
    
    await new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
      
      doc.fontSize(24).text(ticket.event.title, { align: "center" });
      doc.moveDown();
      doc.fontSize(14).text(ticket.ticketLot.ticketType.name, { align: "center" });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Data: ${new Date(ticket.event.startAt).toLocaleString("pt-PT")}`);
      doc.text(`Local: ${ticket.event.venueName}`);
      doc.text(`Bilhete ID: ${ticket.id}`);
      doc.text(`Participante: ${ticket.attendeeName}`);
      doc.text(`Email: ${ticket.attendeeEmail}`);
      doc.moveDown();
      doc.text("Apresente este bilhete na entrada do evento.", { align: "center" });
      
      doc.end();
    });

    attachments.push({
      filename: `bilhete-${ticket.id.substring(0, 8)}.pdf`,
      content: Buffer.concat(chunks),
    });
  }

  // Send email
  const info = await transporter.sendMail({
    from: `"EasyTicket" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: `Os seus bilhetes para ${order.event.title}`,
    html: `
      <h1>🎫 Bilhetes Confirmados!</h1>
      <p>Obrigado pela sua compra! Os seus bilhetes para <strong>${order.event.title}</strong> estão anexados a este email.</p>
      <p><strong>Total de bilhetes:</strong> ${order.tickets.length}</p>
      <p>Os bilhetes em PDF estão anexados a este email.</p>
    `,
    attachments,
  });

  return info;
}

async function main() {
  console.log("📧 Reenviando email de bilhetes...\n");

  // Get the most recent paid order
  const order = await prisma.order.findFirst({
    where: { status: "PAID" },
    include: {
      event: { select: { title: true } },
      user: { select: { email: true, name: true } },
      tickets: { take: 1 },
    },
    orderBy: { paidAt: "desc" },
  });

  if (!order) {
    console.log("❌ Nenhuma encomenda paga encontrada");
    return;
  }

  console.log(`📦 Encomenda: ${order.id}`);
  console.log(`   Evento: ${order.event.title}`);
  console.log(`   Bilhetes: ${order.tickets.length}\n`);

  // Determine recipient email
  let recipientEmail = order.buyerEmail || order.user.email;
  
  if (!recipientEmail) {
    console.error("❌ Nenhum email encontrado!");
    console.log("\n💡 Por favor, forneça o email para onde enviar:");
    console.log("   node scripts/resend-ticket-email.js <email@exemplo.com>");
    return;
  }

  console.log(`📧 Enviando para: ${recipientEmail}\n`);

  // If email provided as argument, use it
  const args = process.argv.slice(2);
  if (args.length > 0) {
    recipientEmail = args[0];
    console.log(`📧 Usando email fornecido: ${recipientEmail}\n`);
  }

  try {
    const info = await sendTicketsEmailManually(order.id, recipientEmail);
    console.log("✅ Email enviado com sucesso!");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Para: ${info.accepted.join(", ")}`);
  } catch (error) {
    console.error("❌ Erro ao enviar email:");
    console.error(`   ${error.message}`);
    if (error.response) {
      console.error(`   Response: ${error.response}`);
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

