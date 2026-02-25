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
              <h1>EasyTickets</h1>
            </div>
            <div class="content">
              ${betaBanner}
              ${content}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} EasyTickets. Todos os direitos reservados.</p>
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
    <p>Obrigado por se registar na EasyTickets!</p>
    <p>Para ativar a sua conta, clique no botão abaixo para verificar o seu email:</p>
    <p style="text-align: center;">
      <a href="${variables.verificationUrl}" class="button">Verificar Email</a>
    </p>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #667eea;">${variables.verificationUrl}</p>
    ${variables.expiresIn ? `<p style="font-size: 12px; color: #666;">Este link expira em ${variables.expiresIn}.</p>` : ""}
    <p>Se não criou uma conta na EasyTickets, pode ignorar este email.</p>
  `;

  return {
    subject: "Verifique o seu email - EasyTickets",
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

/** Branding for ticket email (Protocolo Visual) */
export type TicketEmailBranding = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  bannerUrl?: string | null;
  headerTitle?: string | null;
};

/**
 * Ticket Delivery Template
 * Uses event branding (primary color, banner URL) when provided for the email ticket design.
 */
export function getTicketEmailTemplate(variables: {
  name: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  address: string;
  ticketCount: number;
  downloadLink?: string;
  branding?: TicketEmailBranding | null;
  ticketCode?: string | null;
  qrCodeImageUrl?: string | null;
}): { subject: string; html: string; text: string } {
  const primaryColor = variables.branding?.primaryColor || "#6C2BD9";
  const headerTitle = variables.branding?.headerTitle?.trim() || "O teu bilhete";
  const bannerUrl = variables.branding?.bannerUrl?.trim();

  const downloadSection = variables.downloadLink
    ? `
    <div style="background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <p><strong>Descarregar bilhetes:</strong></p>
      <p style="text-align: center;">
        <a href="${variables.downloadLink}" style="display: inline-block; background: ${primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Descarregar PDF</a>
      </p>
    </div>
  `
    : "";

  const qrSection =
    variables.qrCodeImageUrl || variables.ticketCode
      ? `
    <p style="font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;"><strong>MOSTRE ESTE CÓDIGO QR NA ENTRADA:</strong></p>
    ${variables.qrCodeImageUrl ? `<p style="text-align: center; margin: 16px 0;"><img src="${variables.qrCodeImageUrl}" alt="QR Code" width="180" height="180" style="max-width: 180px; height: auto;" /></p>` : ""}
    ${variables.ticketCode ? `<p style="text-align: center; font-family: monospace; font-size: 16px; font-weight: bold; color: #333; margin: 8px 0;">${variables.ticketCode}</p>` : ""}
    <p style="font-size: 11px; color: #666; margin-top: 12px;">Se o QR code não aparecer, use o código acima.</p>
  `
      : "";

  const bodyContent = `
    <p>Olá <strong>${variables.name}</strong>, aqui está o teu acesso.</p>
    ${qrSection}
    <p>Os seus bilhetes para <strong>${variables.eventTitle}</strong> estão prontos!</p>
    <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid ${primaryColor};">
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

  const betaBanner = getConfig().mode === "public_beta"
    ? `<div style="background: #ffc107; color: #000; padding: 15px; margin-bottom: 20px; border-radius: 5px; text-align: center; font-weight: bold;">⚠️ AMBIENTE BETA</div>`
    : "";

  const ticketHeader = bannerUrl
    ? `<div style="width: 100%; max-height: 120px; overflow: hidden; text-align: center;"><img src="${bannerUrl}" alt="" style="max-width: 100%; height: auto; max-height: 120px; object-fit: cover;" /></div><div style="background: ${primaryColor}; color: white; padding: 16px 24px; text-align: center;"><h1 style="margin: 0; font-size: 22px; font-weight: 600;">${headerTitle}</h1></div>`
    : `<div style="background: ${primaryColor}; color: white; padding: 24px 30px; text-align: center; display: flex; align-items: center; justify-content: center; gap: 10px;"><span style="font-size: 20px;">🎫</span><h1 style="margin: 0; font-size: 22px; font-weight: 600;">${headerTitle}</h1></div>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5; margin: 0; padding: 0; }
          .email-container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .content { padding: 30px; background: #ffffff; }
          .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div style="padding: 20px;">
          <div class="email-container">
            ${ticketHeader}
            <div class="content">
              ${betaBanner}
              ${bodyContent}
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

  return {
    subject: `Os seus bilhetes para ${variables.eventTitle}`,
    html,
    text: `Olá ${variables.name},\n\nBilhetes para ${variables.eventTitle}\nData: ${variables.eventDate}\nLocal: ${variables.venueName}${variables.ticketCode ? `\nCódigo: ${variables.ticketCode}` : ""}`,
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

/**
 * Organization Invite Template
 */
export function getOrganizationInviteTemplate(variables: {
  organizationName: string;
  acceptUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
    <p>Olá,</p>
    <p>Foi convidado para se juntar à organização <strong>${variables.organizationName}</strong> na EasyTickets!</p>
    <p>Como membro, poderá gerir eventos, bilhetes e consultar analytics da organização.</p>
    <p>Para aceitar este convite, clique no botão abaixo:</p>
    <p style="text-align: center;">
      <a href="${variables.acceptUrl}" class="button">Aceitar Convite</a>
    </p>
    <p>Ou copie e cole este link no seu navegador:</p>
    <p style="word-break: break-all; color: #667eea;">${variables.acceptUrl}</p>
    ${variables.expiresIn ? `<p style="font-size: 12px; color: #666;">Este convite expira em ${variables.expiresIn}.</p>` : ""}
    <p>Se não esperava este convite, pode ignorar este email com segurança.</p>
  `;

  return {
    subject: `Convite para a organização ${variables.organizationName} - EasyTickets`,
    html: getBaseTemplate(content, getConfig().mode === "public_beta"),
    text: `Olá,\n\nFoi convidado para a organização ${variables.organizationName}.\nAceitar convite: ${variables.acceptUrl}`,
  };
}

/**
 * Event Reminder 24h Template
 */
export function getEventReminderTemplate(variables: {
  name: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  address: string;
  ticketUrl: string;
}): { subject: string; html: string; text: string } {
  const content = `
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>O evento <strong>${variables.eventTitle}</strong> começa em menos de 24 horas!</p>
    <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0;">Lembrete de Evento</h3>
      <p><strong>Evento:</strong> ${variables.eventTitle}</p>
      <p><strong>Data/Hora:</strong> ${variables.eventDate}</p>
      <p><strong>Local:</strong> ${variables.venueName}</p>
      <p><strong>Morada:</strong> ${variables.address}</p>
    </div>
    <p>Certifique-se de que tem os seus bilhetes prontos:</p>
    <p style="text-align: center;">
      <a href="${variables.ticketUrl}" class="button">Ver Bilhetes</a>
    </p>
    <p>Estamos ansiosos para vê-lo lá!</p>
  `;

  return {
    subject: `Lembrete: ${variables.eventTitle} amanhã!`,
    html: getBaseTemplate(content, getConfig().mode === "public_beta"),
    text: `Olá ${variables.name},\n\nO evento ${variables.eventTitle} é amanhã!\nVer bilhetes: ${variables.ticketUrl}`,
  };
}

/**
 * Post-Event Thank You Template
 */
export function getPostEventThankYouTemplate(variables: {
  name: string;
  eventTitle: string;
  feedbackUrl?: string;
}): { subject: string; html: string; text: string } {
  const content = `
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Esperamos que tenha gostado do evento <strong>${variables.eventTitle}</strong>!</p>
    <p>Obrigado por ter participado e feito parte desta experiência connosco.</p>
    ${variables.feedbackUrl ? `
    <p>Gostaríamos muito de saber a sua opinião. Se tiver um minuto, deixe-nos o seu feedback:</p>
    <p style="text-align: center;">
      <a href="${variables.feedbackUrl}" class="button">Deixar Feedback</a>
    </p>
    ` : ""}
    <p>Até à próxima!</p>
  `;

  return {
    subject: `Obrigado por ter ido ao evento: ${variables.eventTitle}`,
    html: getBaseTemplate(content, getConfig().mode === "public_beta"),
    text: `Olá ${variables.name},\n\nObrigado por ter participado no evento ${variables.eventTitle}!`,
  };
}

/**
 * Promoter Daily Report Template
 */
export function getPromoterDailyReportTemplate(variables: {
  promoterName: string;
  date: string;
  totalSales: string;
  ticketsSold: number;
  upcomingEvents: Array<{ title: string; date: string; sold: number }>;
}): { subject: string; html: string; text: string } {

  const eventsHtml = variables.upcomingEvents.length > 0
    ? variables.upcomingEvents.map(e => `<li><strong>${e.title}</strong> (${e.date}): ${e.sold} bilhetes vendidos</li>`).join("")
    : "<li>Sem eventos agendados em breve.</li>";

  const content = `
    <p>Olá <strong>${variables.promoterName}</strong>,</p>
    <p>Aqui está o resumo diário das suas vendas até <strong>${variables.date}</strong>:</p>
    
    <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10B981;">
      <h3 style="margin-top: 0; color: #10B981;">Resumo de Vendas (Últimas 24h)</h3>
      <p style="font-size: 18px;"><strong>Receita:</strong> ${variables.totalSales}</p>
      <p style="font-size: 18px;"><strong>Bilhetes Vendidos:</strong> ${variables.ticketsSold}</p>
    </div>

    <h3>Estado dos Próximos Eventos</h3>
    <ul>
      ${eventsHtml}
    </ul>

    <p style="text-align: center; margin-top: 30px;">
      <a href="https://tickets.daowave.pt/promotor" class="button" style="background: #10B981;">Aceder ao Dashboard</a>
    </p>
  `;

  return {
    subject: `Relatório Diário de Vendas - EasyTickets`,
    html: getBaseTemplate(content), // No beta banner for internal promoter reports usually, or leave it
    text: `Olá ${variables.promoterName},\n\nReceita de hoje: ${variables.totalSales}\nBilhetes: ${variables.ticketsSold}\n\nAceda ao dashboard para mais detalhes.`,
  };
}
