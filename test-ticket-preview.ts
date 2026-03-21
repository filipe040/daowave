import { PrismaClient } from '@prisma/client';
import { TicketRenderService } from './apps/web/lib/tickets/ticket-render.service';

const prisma = new PrismaClient();

async function main() {
  try {
    const template = await prisma.organizationTicketTemplate.findFirst({
        where: { status: 'ACTIVE' }
    });
    
    if (!template) {
        console.log("No template found");
        return;
    }

    console.log("Found template:", template.id);
    const pdfBuffer = await TicketRenderService.renderPdf("SAMPLE", template.id);
    console.log("PDF Buffer length:", pdfBuffer.length);
  } catch (error) {
    console.error("Preview failed with error:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
