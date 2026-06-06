/**
 * Invoice PDF Generator — HTML (Playwright) + PDFKit fallback
 */

import type { ResolvedInvoiceTheme } from "./invoice-theme";
import { resolveInvoiceTheme } from "./invoice-theme";
import { generateInvoicePdfKit } from "./invoice-pdfkit";
import { tryRenderHtmlToPdf } from "../pdf/html-to-pdf";
import { safeLog } from "../security";

export interface InvoiceData {
  invoiceNumber: string;
  issuedAt: Date;
  sellerName: string;
  sellerAddress: string;
  sellerNif?: string;
  buyerName: string;
  buyerEmail: string;
  buyerNif?: string;
  orderId: string;
  currency: string;
  paymentMethod?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  totalCents: number;
  theme: ResolvedInvoiceTheme;
}

function formatCurrency(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const t = data.theme;
  const rows = data.items
    .map(
      (item) => `
    <tr>
      <td class="desc">${escapeHtml(item.description)}</td>
      <td class="center">${item.quantity}</td>
      <td class="right">${formatCurrency(item.unitPriceCents, data.currency)}</td>
      <td class="right total-cell">${formatCurrency(item.totalCents, data.currency)}</td>
    </tr>
  `
    )
    .join("");

  const ivaRate = 0.23;
  const baseAmount = Math.round(data.totalCents / (1 + ivaRate));
  const ivaAmount = data.totalCents - baseAmount;

  const logoBlock = t.logoUrl
    ? `<img src="${escapeHtml(t.logoUrl)}" alt="" class="logo" />`
    : `<div class="brand-text">${escapeHtml(t.brandName)}</div>`;

  const platformFooter = t.showPlatformCredit
    ? `<div class="platform-credit">Emitido via GoPass · tickets.daowave.pt</div>`
    : "";

  const customFooter = t.footerText
    ? `<div class="custom-footer">${escapeHtml(t.footerText)}</div>`
    : "";

  const websiteLine = t.websiteUrl
    ? `<div class="footer-website">${escapeHtml(t.websiteUrl.replace(/^https?:\/\//, ""))}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<title>Fatura/Recibo ${escapeHtml(data.invoiceNumber)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;background:${t.backgroundColor};color:${t.textColor};-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:${t.backgroundColor};padding:0}
  .accent-bar{height:6px;background:linear-gradient(90deg,${t.primaryColor},${t.secondaryColor})}
  .content{padding:40px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:28px;border-bottom:1px solid #E4E4E7}
  .logo{max-height:56px;max-width:200px;object-fit:contain}
  .brand-text{font-size:26px;font-weight:800;letter-spacing:-.04em;color:${t.textColor}}
  .brand-sub{font-size:11px;color:${t.mutedColor};margin-top:6px;font-weight:600;text-transform:uppercase;letter-spacing:.08em}
  .invoice-meta{text-align:right}
  .invoice-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${t.primaryColor};margin-bottom:6px}
  .invoice-number{font-size:20px;font-weight:800;color:${t.textColor}}
  .invoice-date{font-size:13px;color:${t.mutedColor};margin-top:4px}
  .status-badge{display:inline-flex;align-items:center;gap:6px;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:20px;padding:4px 12px;font-size:11px;font-weight:700;color:#059669;margin-top:12px}
  .status-dot{width:6px;height:6px;background:#10B981;border-radius:50%}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:36px}
  .party-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${t.mutedColor};margin-bottom:8px}
  .party-name{font-size:16px;font-weight:700;color:${t.textColor};margin-bottom:4px}
  .party-detail{font-size:13px;color:${t.mutedColor};line-height:1.6}
  .table-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${t.mutedColor};margin-bottom:12px}
  table{width:100%;border-collapse:collapse;margin-bottom:28px}
  thead tr{background:#F4F4F5}
  thead th{padding:12px 16px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${t.mutedColor};text-align:left}
  thead th.right,thead th.center{text-align:right}
  thead th.center{text-align:center}
  tbody tr{border-bottom:1px solid #F4F4F5}
  tbody td{padding:14px 16px;font-size:14px;color:${t.textColor};vertical-align:top}
  tbody td.center{text-align:center;font-weight:600}
  tbody td.right{text-align:right}
  tbody td.total-cell{font-weight:700}
  tbody td.desc{max-width:280px;line-height:1.5}
  .totals{margin-left:auto;width:280px;border:1px solid #E4E4E7;border-radius:12px;overflow:hidden}
  .total-row{display:flex;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #F4F4F5}
  .total-row:last-child{border-bottom:none}
  .total-row.main{background:${t.primaryColor}10;padding:16px 20px}
  .total-label{font-size:13px;color:${t.mutedColor}}
  .total-value{font-size:13px;font-weight:600;color:${t.textColor}}
  .total-row.main .total-label{font-size:14px;font-weight:700;color:${t.textColor}}
  .total-row.main .total-value{font-size:18px;font-weight:800;color:${t.primaryColor}}
  .payment-info{margin-top:12px;display:flex;align-items:center;gap:8px;justify-content:flex-end;font-size:12px;color:${t.mutedColor}}
  .payment-badge{background:#F4F4F5;border-radius:6px;padding:5px 12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  .iva-note{margin-top:32px;padding:16px 20px;background:#FAFAFA;border:1px solid #E4E4E7;border-radius:10px;font-size:12px;color:${t.mutedColor};line-height:1.6}
  .iva-note strong{color:${t.textColor}}
  .footer{margin-top:36px;padding-top:24px;border-top:1px solid #E4E4E7;display:flex;justify-content:space-between;align-items:flex-end}
  .footer-brand{font-size:14px;font-weight:700;color:${t.textColor}}
  .footer-right{font-size:11px;color:${t.mutedColor};text-align:right;line-height:1.6}
  .platform-credit{font-size:10px;color:${t.mutedColor};margin-top:8px;opacity:.8}
  .custom-footer{font-size:11px;color:${t.mutedColor};margin-top:4px}
  .footer-website{font-size:11px;color:${t.primaryColor};margin-top:2px}
</style>
</head>
<body>
<div class="page">
  <div class="accent-bar"></div>
  <div class="content">
    <div class="header">
      <div>
        ${logoBlock}
        <div class="brand-sub">${escapeHtml(t.tagline)}</div>
        <span class="status-badge"><span class="status-dot"></span>PAGO</span>
      </div>
      <div class="invoice-meta">
        <div class="invoice-title">Fatura / Recibo</div>
        <div class="invoice-number">${escapeHtml(data.invoiceNumber)}</div>
        <div class="invoice-date">${data.issuedAt.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}</div>
      </div>
    </div>
    <div class="parties">
      <div>
        <div class="party-label">Vendedor</div>
        <div class="party-name">${escapeHtml(data.sellerName)}</div>
        <div class="party-detail">
          ${escapeHtml(data.sellerAddress)}<br>
          ${data.sellerNif ? `NIF: ${escapeHtml(data.sellerNif)}` : ""}
        </div>
      </div>
      <div>
        <div class="party-label">Comprador</div>
        <div class="party-name">${escapeHtml(data.buyerName)}</div>
        <div class="party-detail">
          ${escapeHtml(data.buyerEmail)}<br>
          ${data.buyerNif ? `NIF: ${escapeHtml(data.buyerNif)}` : "Consumidor final"}
        </div>
      </div>
    </div>
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
      <tbody>${rows}</tbody>
    </table>
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
    ${
      data.paymentMethod
        ? `<div class="payment-info">Método de pagamento: <span class="payment-badge">${escapeHtml(data.paymentMethod)}</span></div>`
        : ""
    }
    <div class="iva-note">
      <p>
        <strong>Nota fiscal:</strong> IVA incluído no preço à taxa de 23% (Artigo 18.º do CIVA).<br>
        Referência de encomenda: <strong>${escapeHtml(data.orderId.substring(0, 8).toUpperCase())}</strong><br>
        Este documento serve de fatura/recibo nos termos do Decreto-Lei n.º 256/2003 de 21 de outubro.
      </p>
    </div>
    <div class="footer">
      <div>
        <div class="footer-brand">${escapeHtml(t.brandName)}</div>
        ${websiteLine}
        ${customFooter}
        ${platformFooter}
      </div>
      <div class="footer-right">
        <div>Documento gerado automaticamente</div>
        <div>${data.issuedAt.toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

/**
 * Gera PDF branded — HTML via Playwright (igual ao preview), fallback PDFKit
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const html = generateInvoiceHtml(data);
  const fromHtml = await tryRenderHtmlToPdf(html, {
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });
  if (fromHtml) {
    return fromHtml;
  }

  safeLog.warn("Invoice PDF: a usar fallback PDFKit (instale Playwright na VPS para design completo)");
  return generateInvoicePdfKit(data);
}

export function buildInvoiceData(order: {
  id: string;
  totalCents: number;
  currency: string;
  createdAt: Date;
  buyerName?: string | null;
  buyerEmail?: string | null;
  paymentProvider?: string | null;
  user: { name?: string | null; email: string };
  event: {
    title: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    invoiceThemeJson?: unknown;
    organization?: {
      name?: string | null;
      legalName?: string | null;
      address?: string | null;
      vatNumber?: string | null;
      logoUrl?: string | null;
      website?: string | null;
      invoiceThemeJson?: unknown;
    } | null;
  };
  items: Array<{
    quantity: number;
    unitPriceCents: number;
    ticketLot: { name: string };
  }>;
}): InvoiceData {
  const invoiceNumber = `REC-${order.createdAt.getFullYear()}-${order.id.substring(0, 8).toUpperCase()}`;
  const org = order.event.organization;
  const theme = resolveInvoiceTheme({
    organization: org,
    event: order.event,
  });

  return {
    invoiceNumber,
    issuedAt: order.createdAt,
    sellerName: org?.legalName || org?.name || theme.brandName,
    sellerAddress: org?.address || "Portugal",
    sellerNif: org?.vatNumber || undefined,
    buyerName: order.buyerName || order.user.name || "Consumidor final",
    buyerEmail: order.buyerEmail || order.user.email,
    orderId: order.id,
    currency: order.currency || "EUR",
    paymentMethod: order.paymentProvider
      ? order.paymentProvider.replace(/_/g, " ")
      : undefined,
    items: order.items.map((item) => ({
      description: `Bilhete — ${order.event.title} (${item.ticketLot.name})`,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.quantity * item.unitPriceCents,
    })),
    totalCents: order.totalCents,
    theme,
  };
}

export function buildSampleInvoiceData(
  theme: ResolvedInvoiceTheme,
  org?: { name?: string | null; address?: string | null; vatNumber?: string | null }
): InvoiceData {
  const now = new Date();
  return {
    invoiceNumber: `REC-${now.getFullYear()}-PREVIEW01`,
    issuedAt: now,
    sellerName: org?.name || theme.brandName,
    sellerAddress: org?.address || "Portugal",
    sellerNif: org?.vatNumber || undefined,
    buyerName: "João Silva",
    buyerEmail: "cliente@exemplo.pt",
    orderId: "00000000-0000-0000-0000-000000000001",
    currency: "EUR",
    paymentMethod: "Cartão",
    items: [
      {
        description: "Bilhete — Festival Exemplo (Passe Geral)",
        quantity: 2,
        unitPriceCents: 2500,
        totalCents: 5000,
      },
    ],
    totalCents: 5000,
    theme,
  };
}
