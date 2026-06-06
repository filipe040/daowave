/**
 * Marketing & legacy email wrappers — Light GoPass theme
 */

import { config } from "./config";
import { EMAIL } from "./email-templates-transactional";

export interface EmailTemplateOptions {
  title: string;
  content: string;
  showBetaBanner?: boolean;
  supportEmail?: string;
  downloadLink?: string;
  downloadLinkExpiresAt?: Date;
}

export function getBetaEmailTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    content,
    showBetaBanner = config.env.isStaging,
    supportEmail = config.app.supportEmail || "suporte@gopass.pt",
    downloadLink,
    downloadLinkExpiresAt,
  } = options;

  const betaBanner = showBetaBanner
    ? `<div style="background:${EMAIL.warnBg};border:1px solid ${EMAIL.warnBorder};border-radius:10px;padding:14px 16px;margin-bottom:24px;text-align:center;font-size:13px;font-weight:700;color:${EMAIL.warnText}">⚠️ Ambiente beta — email de teste</div>`
    : "";

  const downloadSection = downloadLink
    ? `<div style="background:${EMAIL.surfaceMuted};border:1px solid ${EMAIL.border};border-radius:12px;padding:24px;margin:24px 0;text-align:center">
      <h3 style="margin:0 0 8px;color:${EMAIL.text};font-size:18px;font-weight:800">📥 Download do bilhete</h3>
      <p style="margin:8px 0 20px;color:${EMAIL.textSecondary};font-size:14px">Aceda ao seu bilhete através do link abaixo:</p>
      <a href="${downloadLink}" style="display:inline-block;background:linear-gradient(135deg,${EMAIL.accent} 0%,${EMAIL.accent2} 100%);color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 14px rgba(124,58,237,.35)">Descarregar bilhete</a>
      ${downloadLinkExpiresAt
        ? `<p style="font-size:12px;color:${EMAIL.textMuted};margin-top:16px">Expira a ${downloadLinkExpiresAt.toLocaleString("pt-PT")}</p>`
        : ""}
      <p style="font-size:12px;color:${EMAIL.textMuted};margin-top:12px">Se expirar, solicite um novo em <strong>Meus bilhetes</strong> na GoPass.</p>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:${EMAIL.text};background:${EMAIL.bg};margin:0;padding:0;-webkit-font-smoothing:antialiased}
a{color:${EMAIL.link};font-weight:600}
</style>
</head>
<body>
<div style="background:${EMAIL.bg};padding:40px 16px;width:100%;box-sizing:border-box">
  <div style="max-width:600px;margin:0 auto;background:${EMAIL.surface};border-radius:16px;overflow:hidden;border:1px solid ${EMAIL.border};box-shadow:0 4px 24px rgba(15,23,42,.08)">
    <div style="height:4px;background:linear-gradient(90deg,${EMAIL.accent},${EMAIL.accent2})"></div>
    <div style="background:${EMAIL.surface};padding:36px 32px 28px;text-align:center;border-bottom:1px solid ${EMAIL.border}">
      <div style="font-size:26px;font-weight:900;color:${EMAIL.text};letter-spacing:-.04em">GO<span style="color:${EMAIL.accent}">PASS</span></div>
      <h1 style="margin:16px 0 0;font-size:22px;font-weight:800;color:${EMAIL.text};letter-spacing:-.02em">${title}</h1>
    </div>
    <div style="padding:36px 32px;background:${EMAIL.surface};color:${EMAIL.textSecondary};font-size:15px">
      ${betaBanner}
      ${content}
      ${downloadSection}
    </div>
    <div style="background:${EMAIL.surfaceMuted};padding:28px 32px;text-align:center;color:${EMAIL.textMuted};font-size:13px;border-top:1px solid ${EMAIL.border}">
      <p style="margin:0 0 8px">&copy; ${new Date().getFullYear()} GoPass. Bilhética &amp; acesso.</p>
      <p style="margin:0 0 8px">Precisa de ajuda? <a href="mailto:${supportEmail}" style="color:${EMAIL.link}">${supportEmail}</a></p>
      ${showBetaBanner ? `<p style="margin-top:16px;font-size:11px;color:${EMAIL.textMuted}">[Ambiente beta] Bilhetes de teste da plataforma.</p>` : ""}
    </div>
  </div>
</div>
</body>
</html>`;
}

export function getTicketEmailTemplate(
  eventTitle: string,
  eventDate: string,
  venueName: string,
  address: string,
  ticketCount: number,
  downloadLink?: string,
  downloadLinkExpiresAt?: Date
): string {
  const content = `
    <p style="color:${EMAIL.text};font-weight:500">Olá,</p>
    <p>Obrigado pela sua compra! Os seus bilhetes para <strong style="color:${EMAIL.text}">${eventTitle}</strong> estão prontos.</p>
    <div style="background:${EMAIL.surfaceMuted};padding:24px;margin:24px 0;border-radius:12px;border:1px solid ${EMAIL.border};border-left:4px solid ${EMAIL.accent}">
      <h3 style="margin:0 0 16px;color:${EMAIL.text};font-size:16px;font-weight:800">Detalhes do evento</h3>
      <p style="margin:0 0 8px;color:${EMAIL.textSecondary}"><strong style="color:${EMAIL.text}">Evento:</strong> ${eventTitle}</p>
      <p style="margin:0 0 8px;color:${EMAIL.textSecondary}"><strong style="color:${EMAIL.text}">Data:</strong> ${eventDate}</p>
      <p style="margin:0 0 8px;color:${EMAIL.textSecondary}"><strong style="color:${EMAIL.text}">Local:</strong> ${venueName}</p>
      <p style="margin:0 0 8px;color:${EMAIL.textSecondary}"><strong style="color:${EMAIL.text}">Morada:</strong> ${address}</p>
      <p style="margin:12px 0 0;color:${EMAIL.accent};font-weight:700"><strong>Bilhetes:</strong> ${ticketCount}</p>
    </div>
    <p><strong style="color:${EMAIL.text}">Importante:</strong></p>
    <ul style="color:${EMAIL.textSecondary};padding-left:20px">
      <li style="margin-bottom:6px">Os bilhetes em PDF estão anexados a este email</li>
      ${downloadLink ? "<li style=\"margin-bottom:6px\">Também pode descarregar através do link abaixo</li>" : ""}
      <li style="margin-bottom:6px">Apresente o código QR na entrada do evento</li>
      <li style="margin-bottom:6px">Guarde este email para referência futura</li>
    </ul>`;

  return getBetaEmailTemplate({
    title: "🎫 Bilhetes confirmados",
    content,
    downloadLink,
    downloadLinkExpiresAt,
  });
}

export function getOrderConfirmationEmailTemplate(
  orderId: string,
  eventTitle: string,
  total: string,
  currency: string = "EUR"
): string {
  const content = `
    <p style="color:${EMAIL.text};font-weight:500">Olá,</p>
    <p>A sua encomenda foi confirmada com sucesso.</p>
    <div style="background:${EMAIL.surfaceMuted};padding:24px;margin:24px 0;border-radius:12px;border:1px solid ${EMAIL.border};border-left:4px solid ${EMAIL.success}">
      <h3 style="margin:0 0 16px;color:${EMAIL.text};font-size:16px;font-weight:800">Detalhes da encomenda</h3>
      <p style="margin:0 0 8px;color:${EMAIL.textSecondary}"><strong style="color:${EMAIL.text}">N.º encomenda:</strong> <span style="font-family:monospace">${orderId}</span></p>
      <p style="margin:0 0 8px;color:${EMAIL.textSecondary}"><strong style="color:${EMAIL.text}">Evento:</strong> ${eventTitle}</p>
      <p style="margin:12px 0 0;font-size:18px;color:${EMAIL.success};font-weight:800">Total: ${total} ${currency}</p>
    </div>
    <p>Os bilhetes serão enviados por email em breve.</p>`;

  return getBetaEmailTemplate({
    title: "✅ Encomenda confirmada",
    content,
  });
}

export function getMarketingCampaignTemplate(
  _subject: string,
  title: string,
  contentHtml: string
): string {
  return getBetaEmailTemplate({ title, content: contentHtml });
}
