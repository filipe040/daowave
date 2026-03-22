/**
 * Invoice PDF Generator
 * Generates a Portuguese-compliant invoice/receipt PDF using Playwright
 */

import { chromium } from "playwright";

export interface InvoiceData {
  invoiceNumber: string; // e.g. "REC-2026-00123"
  issuedAt: Date;
  // Seller
  sellerName: string;
  sellerAddress: string;
  sellerNif?: string;
  // Buyer
  buyerName: string;
  buyerEmail: string;
  buyerNif?: string;
  // Order
  orderId: string;
  currency: string;
  paymentMethod?: string;
  // Line items
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  totalCents: number;
}

function formatCurrency(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency }).format(cents / 100);
}

function generateInvoiceHtml(data: InvoiceData): string {
  const rows = data.items.map(item => `
    <tr>
      <td class="desc">${item.description}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">${formatCurrency(item.unitPriceCents, data.currency)}</td>
      <td class="right total-cell">${formatCurrency(item.totalCents, data.currency)}</td>
    </tr>
  `).join("");

  // IVA 23% included in price (ticket sales in Portugal)
  const ivaRate = 0.23;
  const baseAmount = Math.round(data.totalCents / (1 + ivaRate));
  const ivaAmount = data.totalCents - baseAmount;

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fatura/Recibo ${data.invoiceNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:#09090b;color:#f4f4f5;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#09090b;padding:40px}
  
  /* Header */
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;padding-bottom:32px;border-bottom:1px solid #27272a}
  .brand{font-size:28px;font-weight:900;letter-spacing:-.06em;color:#fff}
  .brand span{color:#10b981}
  .brand-sub{font-size:11px;color:#71717a;margin-top:4px;font-weight:500;text-transform:uppercase;letter-spacing:.08em}
  .invoice-meta{text-align:right}
  .invoice-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#10b981;margin-bottom:8px}
  .invoice-number{font-size:20px;font-weight:800;color:#fff;letter-spacing:-.02em}
  .invoice-date{font-size:13px;color:#a1a1aa;margin-top:4px}
  
  /* Parties */
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:40px}
  .party-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#71717a;margin-bottom:8px}
  .party-name{font-size:16px;font-weight:700;color:#f4f4f5;margin-bottom:4px}
  .party-detail{font-size:13px;color:#a1a1aa;line-height:1.6}
  
  /* Table */
  .table-wrap{margin-bottom:32px}
  .table-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#71717a;margin-bottom:12px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#111113;border-radius:8px}
  thead th{padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#71717a;text-align:left}
  thead th.right,thead th.center{text-align:right}
  thead th.center{text-align:center}
  tbody tr{border-bottom:1px solid #18181b}
  tbody tr:last-child{border-bottom:none}
  tbody td{padding:14px 16px;font-size:14px;color:#d4d4d8;vertical-align:top}
  tbody td.center{text-align:center;color:#f4f4f5;font-weight:600}
  tbody td.right{text-align:right;color:#f4f4f5}
  tbody td.total-cell{font-weight:700;color:#f4f4f5}
  tbody td.desc{max-width:280px;line-height:1.5}
  
  /* Totals */
  .totals{margin-left:auto;width:280px;border:1px solid #27272a;border-radius:12px;overflow:hidden}
  .total-row{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid #1e1e21}
  .total-row:last-child{border-bottom:none}
  .total-row.main{background:#111113;padding:16px 20px}
  .total-label{font-size:13px;color:#a1a1aa}
  .total-value{font-size:13px;color:#f4f4f5;font-weight:600}
  .total-row.main .total-label{font-size:14px;font-weight:700;color:#fff}
  .total-row.main .total-value{font-size:18px;font-weight:900;color:#10b981}
  
  /* Payment badge */
  .payment-info{margin-top:12px;display:flex;align-items:center;gap:8px;justify-content:flex-end}
  .payment-badge{background:#111113;border:1px solid #27272a;border-radius:6px;padding:5px 12px;font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.06em}
  
  /* IVA Note */
  .iva-note{margin-top:40px;padding:16px 20px;background:#111113;border:1px solid #27272a;border-radius:10px}
  .iva-note p{font-size:12px;color:#71717a;line-height:1.6}
  .iva-note strong{color:#a1a1aa}
  
  /* Footer */
  .footer{margin-top:40px;padding-top:24px;border-top:1px solid #27272a;display:flex;justify-content:space-between;align-items:center}
  .footer-brand{font-size:13px;font-weight:700;color:#f4f4f5}
  .footer-brand span{color:#10b981}
  .footer-right{font-size:11px;color:#71717a;text-align:right}
  
  /* Status badge */
  .status-badge{display:inline-flex;align-items:center;gap:6px;background:#052e16;border:1px solid #166534;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:700;color:#4ade80;letter-spacing:.04em}
  .status-dot{width:6px;height:6px;background:#10b981;border-radius:50%}
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand">DÃO<span>WAVE</span></div>
      <div class="brand-sub">Bilhética Digital</div>
      <div style="margin-top:12px">
        <span class="status-badge"><span class="status-dot"></span>PAGO</span>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Fatura / Recibo</div>
      <div class="invoice-number">${data.invoiceNumber}</div>
      <div class="invoice-date">${data.issuedAt.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}</div>
    </div>
  </div>

  <!-- Parties -->
  <div class="parties">
    <div>
      <div class="party-label">Vendedor</div>
      <div class="party-name">${data.sellerName}</div>
      <div class="party-detail">
        ${data.sellerAddress}<br>
        ${data.sellerNif ? `NIF: ${data.sellerNif}` : ""}
      </div>
    </div>
    <div>
      <div class="party-label">Comprador</div>
      <div class="party-name">${data.buyerName}</div>
      <div class="party-detail">
        ${data.buyerEmail}<br>
        ${data.buyerNif ? `NIF: ${data.buyerNif}` : "Consumidor final"}
      </div>
    </div>
  </div>

  <!-- Items -->
  <div class="table-wrap">
    <div class="table-label">Descrição dos Serviços</div>
    <table>
      <thead>
        <tr>
          <th>Descrição</th>
          <th class="center">Qtd.</th>
          <th class="right">Preço Unit.</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>

  <!-- Totals -->
  <div class="totals">
    <div class="total-row">
      <span class="total-label">Subtotal (sem IVA)</span>
      <span class="total-value">${formatCurrency(baseAmount, data.currency)}</span>
    </div>
    <div class="total-row">
      <span class="total-label">IVA 23%</span>
      <span class="total-value">${formatCurrency(ivaAmount, data.currency)}</span>
    </div>
    <div class="total-row main">
      <span class="total-label">Total</span>
      <span class="total-value">${formatCurrency(data.totalCents, data.currency)}</span>
    </div>
  </div>

  ${data.paymentMethod ? `
  <div class="payment-info">
    <span style="font-size:12px;color:#71717a">Método de pagamento:</span>
    <span class="payment-badge">${data.paymentMethod}</span>
  </div>` : ""}

  <!-- IVA Note -->
  <div class="iva-note">
    <p>
      <strong>Nota fiscal:</strong> IVA incluído no preço à taxa de 23% (Artigo 18.º do CIVA).<br>
      Referência de encomenda: <strong>${data.orderId.substring(0, 8).toUpperCase()}</strong><br>
      Este documento serve de fatura/recibo nos termos do Decreto-Lei n.º 256/2003 de 21 de outubro.
    </p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>
      <div class="footer-brand">DÃO<span>WAVE</span></div>
      <div style="font-size:11px;color:#71717a;margin-top:2px">tickets.daowave.pt</div>
    </div>
    <div class="footer-right">
      <div>Documento gerado automaticamente</div>
      <div>${data.issuedAt.toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

/**
 * Generate invoice PDF as a Buffer using Playwright (headless Chromium)
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(generateInvoiceHtml(data), { waitUntil: "networkidle" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser?.close();
  }
}

/**
 * Build InvoiceData from an order record
 */
export function buildInvoiceData(order: {
  id: string;
  totalCents: number;
  currency: string;
  createdAt: Date;
  buyerName?: string | null;
  buyerEmail?: string | null;
  paymentProvider?: string | null;
  user: { name?: string | null; email: string };
  event: { title: string; organization?: { name?: string | null; address?: string | null; nif?: string | null } | null };
  items: Array<{
    quantity: number;
    unitPriceCents: number;
    ticketLot: { name: string };
  }>;
}): InvoiceData {
  const invoiceNumber = `REC-${order.createdAt.getFullYear()}-${order.id.substring(0, 8).toUpperCase()}`;
  const org = order.event.organization;

  return {
    invoiceNumber,
    issuedAt: order.createdAt,
    sellerName: org?.name || "DãoWave",
    sellerAddress: org?.address || "Portugal",
    sellerNif: (org as any)?.nif || undefined,
    buyerName: order.buyerName || order.user.name || "Consumidor final",
    buyerEmail: order.buyerEmail || order.user.email,
    orderId: order.id,
    currency: order.currency || "EUR",
    paymentMethod: order.paymentProvider
      ? order.paymentProvider.replace("_", " ")
      : undefined,
    items: order.items.map(item => ({
      description: `Bilhete — ${order.event.title} (${item.ticketLot.name})`,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.quantity * item.unitPriceCents,
    })),
    totalCents: order.totalCents,
  };
}
