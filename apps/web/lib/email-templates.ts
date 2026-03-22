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
    supportEmail = config.app.supportEmail || "support@7eventickets.pt",
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
    <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #333;">📥 Download</h3>
      <p style="margin-bottom: 10px;">Pode descarregar o seu bilhete através do link abaixo:</p>
      <p style="margin-bottom: 10px;">
        <a href="${downloadLink}" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Descarregar Bilhete
        </a>
      </p>
      ${downloadLinkExpiresAt
        ? `<p style="font-size: 12px; color: #666; margin-top: 10px;">Este link expira em ${downloadLinkExpiresAt.toLocaleString("pt-PT")}</p>`
        : ""}
      <p style="font-size: 12px; color: #666; margin-top: 10px;">
        <strong>Nota:</strong> Por questões de segurança, este link tem validade limitada. Se o link expirar, pode solicitar um novo através da área "Meus Bilhetes".
      </p>
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
            background: #ffffff;
          }
          .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
          }
          .footer a {
            color: #667eea;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .support-info {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 13px;
            color: #666;
          }
          .support-info a {
            color: #667eea;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div style="padding: 20px;">
          <div class="email-container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              ${betaBanner}
              ${content}
              ${downloadSection}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} GoPass. Todos os direitos reservados.</p>
              <div class="support-info">
                <p>Precisa de ajuda? Contacte-nos:</p>
                <p>
                  <a href="mailto:${supportEmail}">${supportEmail}</a>
                </p>
                ${showBetaBanner
                  ? `<p style="margin-top: 15px; font-size: 11px; color: #999;">
                      Este é um ambiente de teste. Os bilhetes enviados são apenas para fins de demonstração.
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
    
    <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #333;">Detalhes do Evento:</h3>
      <p><strong>Evento:</strong> ${eventTitle}</p>
      <p><strong>Data:</strong> ${eventDate}</p>
      <p><strong>Local:</strong> ${venueName}</p>
      <p><strong>Endereço:</strong> ${address}</p>
      <p><strong>Total de bilhetes:</strong> ${ticketCount}</p>
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
    
    <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #333;">Detalhes da Encomenda:</h3>
      <p><strong>Número da Encomenda:</strong> ${orderId}</p>
      <p><strong>Evento:</strong> ${eventTitle}</p>
      <p><strong>Total:</strong> ${total} ${currency}</p>
    </div>

    <p>Os seus bilhetes serão enviados por email em breve.</p>
  `;

  return getBetaEmailTemplate({
    title: "✅ Encomenda Confirmada",
    content,
  });
}

