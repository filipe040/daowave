/**
 * Email Templates with BETA branding
 */

import { config } from "./config";

export interface EmailTemplateOptions {
  title: string;
  content: string;
  showBetaBanner?: boolean;
  supportEmail?: string;
  downloadLink?: string;
  downloadLinkExpiresAt?: Date;
}

/**
 * Generate base email template with BETA branding
 */
export function getBetaEmailTemplate(options: EmailTemplateOptions): string {
  const {
    title,
    content,
    showBetaBanner = config.env.isStaging,
    supportEmail = config.app.supportEmail || "support@gopass.pt",
    downloadLink,
    downloadLinkExpiresAt,
  } = options;

  const betaBanner = showBetaBanner
    ? `
    <div style="background: #ffc107; color: #000; padding: 15px; margin-bottom: 20px; border-radius: 5px; text-align: center; font-weight: bold; border-left: 4px solid #ff9800;">
      ⚠️ AMBIENTE BETA - Este é um email de teste
    </div>
  `
    : "";

  const downloadSection = downloadLink
    ? `
    <div style="background: #000000; padding: 20px 0; margin-bottom: 20px; text-align: center; border-bottom: 1px solid #1f1f22;">
      <h3 style="margin: 0; color: #ffffff;">📥 Download do seu bilhete</h3>
      <p style="margin-top: 10px; color: #a1a1aa; font-size: 14px;">Tem acesso ao seu bilhete através do link abaixo:</p>
      <div style="margin: 20px 0;">
        <a href="${downloadLink}" style="background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 15px; box-shadow: 0 4px 14px rgba(168,85,247,0.3);">
          Descarregar Bilhete
        </a>
      </div>
      ${downloadLinkExpiresAt
      ? `<p style="font-size: 12px; color: #71717a; margin-top: 10px;">Este link expira a ${downloadLinkExpiresAt.toLocaleString("pt-PT")}</p>`
      : ""}
      <p style="font-size: 12px; color: #71717a; margin-top: 10px;">
        <strong>Nota:</strong> Este link tem validade por segurança. Se expirar, solicite um novo na sua área "Meus Bilhetes" na GoPass.
      </p>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="pt">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="dark">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background-color: #000000;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .email-wrapper {
            background-color: #000000;
            padding: 40px 16px;
            width: 100%;
            box-sizing: border-box;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a0a0b;
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid #1f1f22;
          }
          .header {
            background: linear-gradient(135deg, #0a0a0b 0%, #121214 100%);
            padding: 40px 30px;
            text-align: center;
            border-bottom: 1px solid #1f1f22;
          }
          .logo {
            font-size: 26px;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: -0.04em;
            margin-bottom: 6px;
          }
          .logo span {
            color: #a855f7;
          }
          .header h1 {
            margin: 16px 0 0 0;
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.02em;
          }
          .content {
            padding: 40px 30px;
            background: #0a0a0b;
            color: #a1a1aa;
            font-size: 15px;
          }
          .content p {
            margin-bottom: 18px;
            line-height: 1.65;
          }
          .content strong {
            color: #ffffff;
          }
          .footer {
            background: #000000;
            padding: 30px;
            text-align: center;
            color: #71717a;
            font-size: 13px;
            border-top: 1px solid #1f1f22;
          }
          .footer a {
            color: #71717a;
            text-decoration: underline;
          }
          .footer a:hover {
            color: #a1a1aa;
          }
          .support-info {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #1f1f22;
          }
          .support-info a {
            color: #a855f7;
            text-decoration: none;
            font-weight: 500;
          }
          
          @media only screen and (max-width:600px) {
            .email-wrapper { padding: 16px 8px !important; }
            .content, .header, .footer { padding: 30px 20px !important; }
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-container">
            <div class="header">
              <div class="logo">GO<span>PASS</span></div>
              <h1>${title}</h1>
            </div>
            <div class="content">
              ${betaBanner}
              ${content}
              ${downloadSection}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} GoPass. A melhor experiência em bilhética.</p>
              <div class="support-info">
                <p style="margin-bottom: 8px;">Precisa de ajuda? Fale connosco:</p>
                <p>
                  <a href="mailto:${supportEmail}">${supportEmail}</a>
                </p>
                ${showBetaBanner
      ? `<p style="margin-top: 16px; font-size: 11px; color: #52525b;">
                      [Ambiente Beta] – Os bilhetes enviados são apenas testes da plataforma.
                    </p>`
      : ""}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate ticket email template
 */
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
    <p>Olá,</p>
    <p>Obrigado pela sua compra! Os seus bilhetes para <strong>${eventTitle}</strong> estão prontos.</p>
    
    <div style="background: #121214; padding: 24px; margin: 24px 0; border-radius: 12px; border: 1px solid #1f1f22; border-left: 4px solid #a855f7;">
      <h3 style="margin-top: 0; color: #ffffff; margin-bottom: 16px;">Detalhes do Evento</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <p style="margin: 0;"><strong>Evento:</strong> ${eventTitle}</p>
        <p style="margin: 0;"><strong>Data:</strong> ${eventDate}</p>
        <p style="margin: 0;"><strong>Local:</strong> ${venueName}</p>
        <p style="margin: 0;"><strong>Endereço:</strong> ${address}</p>
        <p style="margin: 0; margin-top: 8px; color: #a855f7;"><strong>Total de bilhetes:</strong> ${ticketCount}</p>
      </div>
    </div>

    <p><strong>Importante:</strong></p>
    <ul>
      <li>Os bilhetes em PDF estão anexados a este email</li>
      ${downloadLink ? "<li>Também pode descarregar através do link abaixo</li>" : ""}
      <li>Apresente o código QR na entrada do evento</li>
      <li>Guarde este email para referência futura</li>
    </ul>
  `;

  return getBetaEmailTemplate({
    title: "🎫 Bilhetes Confirmados!",
    content,
    downloadLink,
    downloadLinkExpiresAt,
  });
}

/**
 * Generate order confirmation email template
 */
export function getOrderConfirmationEmailTemplate(
  orderId: string,
  eventTitle: string,
  total: string,
  currency: string = "EUR"
): string {
  const content = `
    <p>Olá,</p>
    <p>Obrigado pela sua compra! A sua encomenda foi confirmada.</p>
    
    <div style="background: #121214; padding: 24px; margin: 24px 0; border-radius: 12px; border: 1px solid #1f1f22; border-left: 4px solid #10b981;">
      <h3 style="margin-top: 0; color: #ffffff; margin-bottom: 16px;">Detalhes da Encomenda</h3>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <p style="margin: 0;"><strong>№ Encomenda:</strong> <span style="font-family: monospace; color: #a1a1aa;">${orderId}</span></p>
        <p style="margin: 0;"><strong>Evento:</strong> ${eventTitle}</p>
        <p style="margin: 0; margin-top: 8px; font-size: 18px; color: #10b981;"><strong>Total pago:</strong> ${total} ${currency}</p>
      </div>
    </div>

    <p>Os seus bilhetes serão enviados por email em breve.</p>
  `;

  return getBetaEmailTemplate({
    title: "✅ Encomenda Confirmada",
    content,
  });
}

/**
 * Generate marketing campaign template
 */
export function getMarketingCampaignTemplate(
  subject: string,
  title: string,
  contentHtml: string
): string {
  // Use beta template base for marketing wrappers too
  return getBetaEmailTemplate({
    title,
    content: contentHtml,
  });
}

