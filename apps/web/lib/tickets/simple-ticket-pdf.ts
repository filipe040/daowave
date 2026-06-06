import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export async function generateSimpleTicketPDF(params: {
  code: string;
  eventTitle: string;
  eventDate: Date | null;
  venue: string;
  city: string;
  buyerName: string;
  qrPayload?: string;
}): Promise<Buffer> {
  const qrDataUrl = params.qrPayload
    ? await QRCode.toDataURL(params.qrPayload, { width: 220, margin: 1 })
    : null;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).text(params.eventTitle, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("BILHETE DIGITAL", { align: "center" });
    doc.moveDown(2);

    doc.fontSize(12).text(`Código: ${params.code}`);
    doc.text(`Participante: ${params.buyerName}`);
    if (params.eventDate) {
      doc.text(`Data: ${params.eventDate.toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}`);
    }
    doc.text(`Local: ${[params.venue, params.city].filter(Boolean).join(", ") || "A anunciar"}`);
    doc.moveDown(2);

    if (qrDataUrl) {
      const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
      const qrSize = 160;
      const qrX = (doc.page.width - qrSize) / 2;
      const qrY = doc.y;
      doc.image(Buffer.from(qrBase64, "base64"), qrX, qrY, { width: qrSize, height: qrSize });
      doc.y = qrY + qrSize + 24;
    }

    doc.fontSize(10).text("Apresente este documento ou o QR Code na entrada do evento.", {
      align: "center",
    });
    doc.end();
  });
}

export async function generateSimpleInvoicePDF(params: {
  invoiceNumber: string;
  eventTitle: string;
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  totalCents: number;
  currency?: string;
  items: Array<{ name: string; quantity: number; unitPriceCents: number }>;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = params.currency || "EUR";
    doc.fontSize(20).text("FATURA / RECIBO", { align: "center" });
    doc.fontSize(12).text(params.invoiceNumber, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(11).text(`Evento: ${params.eventTitle}`);
    doc.text(`Encomenda: ${params.orderId.substring(0, 8).toUpperCase()}`);
    doc.text(`Comprador: ${params.buyerName}`);
    doc.text(`Email: ${params.buyerEmail}`);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-PT")}`);
    doc.moveDown();

    for (const item of params.items) {
      const lineTotal = ((item.quantity * item.unitPriceCents) / 100).toFixed(2);
      doc.text(`${item.quantity}x ${item.name} — ${lineTotal} ${currency}`);
    }

    doc.moveDown();
    doc.fontSize(13).text(
      `Total: ${(params.totalCents / 100).toFixed(2)} ${currency}`,
      { align: "right" }
    );
    doc.moveDown(2);
    doc.fontSize(9).text(
      "Documento gerado automaticamente. Este recibo serve de comprovativo de pagamento.",
      { align: "center" }
    );
    doc.end();
  });
}
