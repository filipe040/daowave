/**
 * Transactional Email Templates
 * HTML templates for transactional emails (verify-email, reset-password, etc.)
 */

import { getEmailConfig } from "./config/email";

// Lazy load config to avoid errors during module initialization
function getConfig() {
  try {
    return getEmailConfig();
  } catch {
    return { mode: "public_beta" as const };
  }
}

/**
 * Base email template wrapper
 */
function getBaseTemplate(content: string, showBetaBanner: boolean = false): string {
  const betaBanner = showBetaBanner
    ? `
    <div style="background: #ffc107; color: #000; padding: 15px; margin-bottom: 20px; border-radius: 5px; text-align: center; font-weight: bold;">
      ⚠️ AMBIENTE BETA
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
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            background: #f9f9f9;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div style="padding: 20px;">
          <div class="email-container">
            <div class="header">
              <h1>DãoWave</h1>
            </div>
            <div class="content">
              ${betaBanner}
              ${content}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DãoWave. Todos os direitos reservados.</p>
              <p>Se não solicitou este email, pode ignorá-lo com segurança.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Verify Email Template
 */
export function getVerifyEmailTemplate(variables: {
  name: string;
  verificationUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Obrigado por se registar na DãoWave!</p>
    <p>Para ativar a sua conta, clique no botão abaixo para verificar o seu email:</p>
    <p style="text-align: center;">
      <a href="${variables.verificationUrl}" class="button">Verificar Email</a>
    </p>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #667eea;">${variables.verificationUrl}</p>
    ${variables.expiresIn ? `<p style="font-size: 12px; color: #666;">Este link expira em ${variables.expiresIn}.</p>` : ""}
    <p>Se não criou uma conta na DãoWave, pode ignorar este email.</p>
  `;

  return {
    subject: "Verifique o seu email - DãoWave",
    html: getBaseTemplate(content, getConfig().mode === "public_beta"),
    text: `Olá ${variables.name},\n\nVerifique o seu email: ${variables.verificationUrl}`,
  };
}

/**
 * Reset Password Template
 */
export function getPasswordResetEmailTemplate(variables: {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Recebemos uma solicitação para redefinir a palavra-passe da sua conta.</p>
    <p>Clique no botão abaixo para criar uma nova palavra-passe:</p>
    <p style="text-align: center;">
      <a href="${variables.resetUrl}" class="button">Redefinir Palavra-passe</a>
    </p>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #667eea;">${variables.resetUrl}</p>
    ${variables.expiresIn ? `<p style="font-size: 12px; color: #666;">Este link expira em ${variables.expiresIn}.</p>` : ""}
    <p><strong>Se não solicitou esta alteração, ignore este email.</strong> A sua palavra-passe permanecerá inalterada.</p>
  `;

  return {
    subject: "Redefinir palavra-passe - DãoWave",
    html: getBaseTemplate(content, getConfig().mode === "public_beta"),
    text: `Olá ${variables.name},\n\nRedefinir palavra-passe: ${variables.resetUrl}`,
  };
}

/**
 * Order Confirmation Template
 */
export function getOrderConfirmationEmailTemplate(variables: {
  name: string;
  orderId: string;
  eventTitle: string;
  total: string;
  currency?: string;
}): { subject: string; html: string; text: string } {
  const content = `
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Obrigado pela sua compra! A sua encomenda foi confirmada.</p>
    <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0;">Detalhes da Encomenda</h3>
      <p><strong>Número da Encomenda:</strong> ${variables.orderId}</p>
      <p><strong>Evento:</strong> ${variables.eventTitle}</p>
      <p><strong>Total:</strong> ${variables.total} ${variables.currency || "EUR"}</p>
    </div>
    <p>Os seus bilhetes serão enviados por email em breve.</p>
  `;

  return {
    subject: `Encomenda confirmada - ${variables.eventTitle}`,
    html: getBaseTemplate(content, getConfig().mode === "public_beta"),
    text: `Olá ${variables.name},\n\nEncomenda ${variables.orderId} confirmada.\nEvento: ${variables.eventTitle}\nTotal: ${variables.total} ${variables.currency || "EUR"}`,
  };
}

/**
 * Ticket Delivery Template
 */
export function getTicketEmailTemplate(variables: {
  name: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  address: string;
  ticketCount: number;
  downloadLink?: string;
}): { subject: string; html: string; text: string } {
  const downloadSection = variables.downloadLink
    ? `
    <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <p><strong>Descarregar bilhetes:</strong></p>
      <p style="text-align: center;">
        <a href="${variables.downloadLink}" class="button">Descarregar PDF</a>
      </p>
    </div>
  `
    : "";

  const content = `
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Os seus bilhetes para <strong>${variables.eventTitle}</strong> estão prontos!</p>
    <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0;">Detalhes do Evento</h3>
      <p><strong>Evento:</strong> ${variables.eventTitle}</p>
      <p><strong>Data:</strong> ${variables.eventDate}</p>
      <p><strong>Local:</strong> ${variables.venueName}</p>
      <p><strong>Endereço:</strong> ${variables.address}</p>
      <p><strong>Total de bilhetes:</strong> ${variables.ticketCount}</p>
    </div>
    ${downloadSection}
    <p><strong>Importante:</strong></p>
    <ul>
      <li>Os bilhetes em PDF estão anexados a este email</li>
      ${variables.downloadLink ? "<li>Também pode descarregar através do link acima</li>" : ""}
      <li>Apresente o código QR na entrada do evento</li>
      <li>Guarde este email para referência futura</li>
    </ul>
  `;

  return {
    subject: `Os seus bilhetes para ${variables.eventTitle}`,
    html: getBaseTemplate(content, getConfig().mode === "public_beta"),
    text: `Olá ${variables.name},\n\nBilhetes para ${variables.eventTitle}\nData: ${variables.eventDate}\nLocal: ${variables.venueName}`,
  };
}

/**
 * Ticket Transfer Template
 */
export function getTicketTransferTemplate(variables: {
  recipientName: string;
  senderName: string;
  eventTitle: string;
  eventDate: string;
  acceptUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
    <p>Olá <strong>${variables.recipientName}</strong>,</p>
    <p><strong>${variables.senderName}</strong> transferiu um bilhete para si!</p>
    <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0;">Detalhes do Bilhete</h3>
      <p><strong>Evento:</strong> ${variables.eventTitle}</p>
      <p><strong>Data:</strong> ${variables.eventDate}</p>
      <p><strong>Remetente:</strong> ${variables.senderName}</p>
    </div>
    <p>Para aceitar este bilhete, clique no botão abaixo:</p>
    <p style="text-align: center;">
      <a href="${variables.acceptUrl}" class="button">Aceitar Bilhete</a>
    </p>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #667eea;">${variables.acceptUrl}</p>
    ${variables.expiresIn ? `<p style="font-size: 12px; color: #666;">Este link expira em ${variables.expiresIn}.</p>` : ""}
    <p>Se não esperava receber este bilhete, pode ignorar este email.</p>
  `;

  return {
    subject: `${variables.senderName} transferiu um bilhete para si - ${variables.eventTitle}`,
    html: getBaseTemplate(content, getConfig().mode === "public_beta"),
    text: `Olá ${variables.recipientName},\n\n${variables.senderName} transferiu um bilhete para ${variables.eventTitle}.\nAceitar: ${variables.acceptUrl}`,
  };
}
