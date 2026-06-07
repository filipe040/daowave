/**
 * Fallback PDFKit para faturas (quando Playwright não está disponível)
 */

import PDFDocument from "pdfkit";
import type { InvoiceData } from "./invoice-pdf.service";

function formatCurrency(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export async function generateInvoicePdfKit(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const t = data.theme;
    const margin = 50;
    const doc = new PDFDocument({ size: "A4", margin });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - margin * 2;

    // Barra de acento
    doc.rect(0, 0, pageWidth, 6).fill(t.primaryColor);

    let y = margin;

    // Cabeçalho — duas colunas
    const headerRightX = margin + contentWidth / 2 + 10;
    const leftColWidth = contentWidth / 2 - 10;

    doc.font("Helvetica-Bold").fontSize(20).fillColor(t.textColor);
    doc.text(t.brandName, margin, y, { width: leftColWidth });

    doc.font("Helvetica-Bold").fontSize(10).fillColor(t.primaryColor);
    doc.text("FATURA / RECIBO", headerRightX, y, {
      width: contentWidth / 2 - 10,
      align: "right",
    });

    y += 26;
    doc.font("Helvetica").fontSize(9).fillColor(t.mutedColor);
    doc.text(t.tagline.toUpperCase(), margin, y, { width: leftColWidth });

    doc.font("Helvetica-Bold").fontSize(14).fillColor(t.textColor);
    doc.text(data.invoiceNumber, headerRightX, y - 4, {
      width: contentWidth / 2 - 10,
      align: "right",
    });

    y += 18;
    doc.font("Helvetica").fontSize(9).fillColor(t.mutedColor);
    doc.text(
      data.issuedAt.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      headerRightX,
      y,
      { width: contentWidth / 2 - 10, align: "right" }
    );

    y += 14;
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#059669");
    doc.text("PAGO", margin, y);

    y += 24;
    doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor("#E4E4E7").stroke();
    y += 20;

    // Vendedor / Comprador
    const col2X = margin + contentWidth / 2 + 10;
    const colW = contentWidth / 2 - 10;
    const partiesY = y;

    doc.font("Helvetica-Bold").fontSize(8).fillColor(t.mutedColor).text("VENDEDOR", margin, partiesY);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(t.textColor).text(data.sellerName, margin, partiesY + 14, { width: colW });
    let leftY = partiesY + 32;
    doc.font("Helvetica").fontSize(9).fillColor(t.mutedColor).text(data.sellerAddress, margin, leftY, { width: colW });
    leftY = doc.y + 4;
    if (data.sellerNif) {
      doc.text(`NIF: ${data.sellerNif}`, margin, leftY, { width: colW });
      leftY = doc.y + 4;
    }

    doc.font("Helvetica-Bold").fontSize(8).fillColor(t.mutedColor).text("COMPRADOR", col2X, partiesY);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(t.textColor).text(data.buyerName, col2X, partiesY + 14, { width: colW });
    doc.font("Helvetica").fontSize(9).fillColor(t.mutedColor).text(data.buyerEmail, col2X, partiesY + 32, { width: colW });
    doc.text(
      data.buyerNif ? `NIF: ${data.buyerNif}` : "Consumidor final",
      col2X,
      doc.y + 4,
      { width: colW }
    );

    y = Math.max(leftY, doc.y) + 28;

    doc.font("Helvetica-Bold").fontSize(8).fillColor(t.mutedColor).text("DESCRICAO DOS SERVICOS", margin, y);
    y += 16;

    for (const item of data.items) {
      doc.font("Helvetica").fontSize(9).fillColor(t.textColor);
      doc.text(`${item.quantity}x ${item.description}`, margin, y, { width: colW + 40 });
      const price = formatCurrency(item.totalCents, data.currency);
      doc.text(price, margin, y, { width: contentWidth, align: "right" });
      y = doc.y + 8;
    }

    y += 12;
    const ivaRate = 0.23;
    const baseAmount = Math.round(data.totalCents / (1 + ivaRate));
    const ivaAmount = data.totalCents - baseAmount;

    const drawTotalRow = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 9);
      doc.fillColor(bold ? t.primaryColor : t.mutedColor).text(label, margin, y, { width: colW + 80 });
      doc.fillColor(bold ? t.primaryColor : t.textColor).text(value, margin, y, { width: contentWidth, align: "right" });
      y = doc.y + (bold ? 10 : 6);
    };

    drawTotalRow("Subtotal (sem IVA)", formatCurrency(baseAmount, data.currency));
    drawTotalRow("IVA 23%", formatCurrency(ivaAmount, data.currency));
    drawTotalRow("Total", formatCurrency(data.totalCents, data.currency), true);

    if (data.paymentMethod) {
      y += 4;
      doc.font("Helvetica").fontSize(8).fillColor(t.mutedColor).text(
        `Metodo de pagamento: ${data.paymentMethod}`,
        margin,
        y,
        { width: contentWidth, align: "right" }
      );
      y = doc.y + 16;
    }

    y += 12;
    doc.font("Helvetica").fontSize(8).fillColor(t.mutedColor).text(
      "Nota fiscal: IVA incluido no preco a taxa de 23% (Artigo 18. do CIVA). Este documento serve de fatura/recibo nos termos do Decreto-Lei n. 256/2003 de 21 de outubro.",
      margin,
      y,
      { width: contentWidth, align: "left", lineGap: 2 }
    );
    y = doc.y + 6;
    doc.text(`Referencia de encomenda: ${data.orderId.substring(0, 8).toUpperCase()}`, margin, y, {
      width: contentWidth,
    });

    y = doc.y + 24;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(t.textColor).text(t.brandName, margin, y);
    y = doc.y + 4;
    if (t.websiteUrl) {
      doc.font("Helvetica").fontSize(8).fillColor(t.primaryColor).text(
        t.websiteUrl.replace(/^https?:\/\//, ""),
        margin,
        y
      );
      y = doc.y + 4;
    }
    if (t.footerText) {
      doc.font("Helvetica").fontSize(8).fillColor(t.mutedColor).text(t.footerText, margin, y, { width: contentWidth });
      y = doc.y + 4;
    }
    if (t.showPlatformCredit) {
      doc.font("Helvetica").fontSize(7).fillColor(t.mutedColor).text(
        "Emitido via LivePass - tickets.daowave.pt",
        margin,
        y
      );
    }

    doc.end();
  });
}
