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
 * Premium SaaS Aesthetic: Clean, Minimal, Professional
 */
function getBaseTemplate(content: string, showBetaBanner: boolean = false): string {
  const betaBanner = showBetaBanner
    ? `
    <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; padding: 12px 16px; margin-bottom: 24px; border-radius: 8px; text-align: center; font-size: 13px; font-weight: 600; letter-spacing: 0.02em;">
      ⚠️ AMBIENTE BETA
    </div>
  `
    : "";

  return `
    <!DOCTYPE html>
    <html lang="pt">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <style>
          /* Base Resets */
          body, p, h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1c;
            background-color: #f5f6f8;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          table { border-collapse: collapse; width: 100%; }
          img { max-width: 100%; height: auto; border: 0; }
          a { color: #19c37d; text-decoration: none; }
          a:hover { text-decoration: underline; }

          /* Layout */
          .wrapper {
            width: 100%;
            background-color: #f5f6f8;
            padding: 40px 20px;
            box-sizing: border-box;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #eaeaea;
          }

          /* Header */
          .header {
            background-color: #0b0b0c;
            padding: 32px 40px;
            text-align: center;
          }
          .header-brand {
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.02em;
            margin: 0;
          }
          .header-subtitle {
            font-size: 13px;
            color: #a1a1aa;
            margin-top: 4px;
            font-weight: 500;
            letter-spacing: 0.01em;
          }

          /* Content */
          .content {
            padding: 40px;
            background-color: #ffffff;
          }
          .content p {
            font-size: 15px;
            color: #3f3f46;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          .content h2 {
            font-size: 20px;
            font-weight: 700;
            color: #18181b;
            margin-bottom: 16px;
            margin-top: 32px;
            letter-spacing: -0.01em;
          }
          .content h2:first-child { margin-top: 0; }
          
          /* Components */
          .info-card {
            background-color: #f4f4f5;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #e4e4e7;
          }
          .info-card p {
            margin-bottom: 12px;
            font-size: 14px;
          }
          .info-card p:last-child { margin-bottom: 0; }
          .info-card strong { color: #18181b; }

          .button-wrap {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            background-color: #19c37d;
            color: #ffffff !important;
            padding: 14px 28px;
            text-decoration: none !important;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            text-align: center;
            transition: background-color 0.2s;
          }

          .meta-text {
            font-size: 13px !important;
            color: #71717a !important;
          }

          /* Footer */
          .footer {
            padding: 32px 40px;
            text-align: center;
            background-color: #fafafa;
            border-top: 1px solid #f4f4f5;
          }
          .footer p {
            font-size: 12px;
            color: #a1a1aa;
            margin-bottom: 8px;
            line-height: 1.5;
          }
          .footer p:last-child { margin-bottom: 0; }

          /* Dark Mode Support (for clients that support it) */
          @media (prefers-color-scheme: dark) {
            .wrapper { background-color: #000000 !important; }
            .container { background-color: #121212 !important; border-color: #27272a !important; }
            .content { background-color: #121212 !important; }
            .content p { color: #d4d4d8 !important; }
            .content h2 { color: #ffffff !important; }
            .info-card { background-color: #18181b !important; border-color: #27272a !important; }
            .info-card strong { color: #ffffff !important; }
            .footer { background-color: #09090b !important; border-top-color: #27272a !important; }
            .footer p { color: #71717a !important; }
            .meta-text { color: #a1a1aa !important; }
          }
          
          /* Mobile Responsiveness */
          @media only screen and (max-width: 600px) {
            .wrapper { padding: 20px 10px !important; }
            .header { padding: 24px 20px !important; }
            .content { padding: 24px 20px !important; }
            .footer { padding: 24px 20px !important; }
            .button { display: block !important; width: 100% !important; box-sizing: border-box !important; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <!-- Visually hidden preheader text -->
          <div style="display: none; max-height: 0px; overflow: hidden;">
            Atualização importante da EasyTickets
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
          </div>
          
          <div class="container">
            <div class="header">
              <h1 class="header-brand">EasyTickets</h1>
              <p class="header-subtitle">Bilhética digital de confiança</p>
            </div>
            
            <div class="content">
              ${betaBanner}
              ${content}
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} EasyTickets. Todos os direitos reservados.</p>
              <p>Este é um email gerado automaticamente, por favor não responda a este endereço.</p>
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
    <h2>Verifique o seu email</h2>
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Obrigado por se registar na EasyTickets. Para ativar a sua conta e garantir a segurança dos seus dados, precisamos que verifique o seu endereço de email.</p>
    
    <div class="button-wrap">
      <a href="${variables.verificationUrl}" class="button">Verificar o meu email</a>
    </div>
    
    <p class="meta-text">Ou copie e cole este link no seu navegador:</p>
    <p class="meta-text" style="word-break: break-all;"><a href="${variables.verificationUrl}">${variables.verificationUrl}</a></p>
    
    ${variables.expiresIn ? `<p class="meta-text" style="margin-top: 16px;">Este link expira em ${variables.expiresIn}.</p>` : ""}
    <p class="meta-text" style="margin-top: 16px;">Se não criou uma conta na EasyTickets, pode ignorar este email de forma segura.</p>
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
    <h2>Redefinição de palavra-passe</h2>
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Recebemos um pedido para redefinir a palavra-passe associada à sua conta. Se foi você, clique no botão abaixo para criar uma nova palavra-passe.</p>
    
    <div class="button-wrap">
      <a href="${variables.resetUrl}" class="button">Redefinir palavra-passe</a>
    </div>
    
    <p class="meta-text">Ou copie e cole este link no seu navegador:</p>
    <p class="meta-text" style="word-break: break-all;"><a href="${variables.resetUrl}">${variables.resetUrl}</a></p>
    
    ${variables.expiresIn ? `<p class="meta-text" style="margin-top: 16px;">Este link expira em ${variables.expiresIn}.</p>` : ""}
    <p class="meta-text" style="margin-top: 16px;"><strong>Se não solicitou esta alteração, ignore este email.</strong> A sua conta permanece segura e a palavra-passe não será alterada.</p>
  `;

  return {
    subject: "Redefinir palavra-passe - EasyTickets",
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
    <h2>Pagamento confirmado</h2>
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Obrigado pela sua compra. A sua encomenda foi processada e confirmada com sucesso.</p>
    
    <div class="info-card">
      <p><strong>Evento:</strong><br>${variables.eventTitle}</p>
      <p><strong>Número da Encomenda:</strong><br>${variables.orderId}</p>
      <p><strong>Total Pago:</strong><br>${variables.total} ${variables.currency || "EUR"}</p>
    </div>
    
    <p>Os seus bilhetes com o código QR de acesso serão enviados muito em breve num email separado.</p>
    <p>Obrigado por escolher a EasyTickets.</p>
  `;

  return {
    subject: `Recibo: Encomenda confirmada - ${variables.eventTitle}`,
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
  const primaryColor = variables.branding?.primaryColor || "#0b0b0c";
  const headerTitle = variables.branding?.headerTitle?.trim() || "O seu bilhete de acesso";
  const bannerUrl = variables.branding?.bannerUrl?.trim();

  // Premium Custom Ticket Header (Overrrides Base Header)
  const ticketHeader = bannerUrl
    ? `
      <div style="width: 100%; height: 160px; overflow: hidden; position: relative;">
        <img src="${bannerUrl}" alt="Event Banner" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
      </div>
      <div style="background-color: ${primaryColor}; padding: 24px 40px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.01em;">${headerTitle}</h1>
      </div>
    `
    : `
      <div style="background-color: ${primaryColor}; padding: 40px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.02em;">${headerTitle}</h1>
      </div>
    `;

  const downloadSection = variables.downloadLink
    ? `
    <div style="background-color: #fafafa; border: 1px solid #e4e4e7; padding: 24px; margin: 32px 0; border-radius: 8px; text-align: center;">
      <p style="margin-bottom: 16px; font-weight: 600; color: #18181b;">Aceder ao formato PDF</p>
      <a href="${variables.downloadLink}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Descarregar Bilhete(s)</a>
      <p style="margin-top: 12px; font-size: 13px; color: #71717a;">Recomendamos fazer o download antes de chegar ao recinto.</p>
    </div>
  `
    : "";

  const qrSection =
    variables.qrCodeImageUrl || variables.ticketCode
      ? `
    <div style="text-align: center; margin: 32px 0; padding: 32px 0; border-top: 1px dashed #e4e4e7; border-bottom: 1px dashed #e4e4e7;">
      <p style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 24px; font-weight: 600;">Código de Acesso Remoto</p>
      ${variables.qrCodeImageUrl ? `<img src="${variables.qrCodeImageUrl}" alt="QR Code" width="200" height="200" style="width: 200px; height: auto; border-radius: 8px; margin: 0 auto; display: block;" />` : ""}
      ${variables.ticketCode ? `<p style="font-family: monospace; font-size: 20px; font-weight: 800; color: #18181b; margin: 24px 0 0 0; letter-spacing: 0.1em;">${variables.ticketCode}</p>` : ""}
    </div>
  `
      : "";

  const bodyContent = `
    <h2>Validação de entrada</h2>
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Os seus bilhetes para o evento <strong>${variables.eventTitle}</strong> estão confirmados e prontos a utilizar.</p>
    
    ${qrSection}
    
    <div class="info-card">
      <h3 style="font-size: 14px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0;">Detalhes do Evento</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #71717a; width: 100px;">Evento:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #18181b;">${variables.eventTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71717a;">Data:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #18181b;">${variables.eventDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71717a;">Local:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #18181b;">${variables.venueName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71717a;">Morada:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #18181b;">${variables.address}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #71717a;">Quantidade:</td>
          <td style="padding: 8px 0; font-weight: 600; color: #18181b;">${variables.ticketCount} bilhete(s)</td>
        </tr>
      </table>
    </div>
    
    ${downloadSection}
    
    <div style="background-color: #fef08a; padding: 16px; border-radius: 8px; margin-top: 32px;">
      <p style="margin: 0; font-size: 13px; color: #854d0e; line-height: 1.5;">
        <strong>Instruções à porta:</strong> Por favor, apresente este email (ou o ficheiro PDF) diretamente no seu smartphone. Aumente o brilho do ecrã para facilitar a leitura do código QR pelo scanner.
      </p>
    </div>
  `;

  // For the ticket delivery, we compose the HTML directly replacing the standard header 
  // with the custom branding header, but keeping the exact same premium structure.

  const betaBanner = getConfig().mode === "public_beta"
    ? `<div style="background-color: #FEF3C7; border: 1px solid #F59E0B; color: #92400E; padding: 12px 16px; margin-bottom: 24px; border-radius: 8px; text-align: center; font-size: 13px; font-weight: 600; letter-spacing: 0.02em;">⚠️ AMBIENTE BETA</div>`
    : "";

  const html = `
    <!DOCTYPE html>
    <html lang="pt">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body, p, h1, h2, h3, h4, h5, h6 { margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1c; background-color: #f5f6f8; -webkit-font-smoothing: antialiased; }
          table { border-collapse: collapse; }
          img { max-width: 100%; height: auto; border: 0; }
          .wrapper { width: 100%; background-color: #f5f6f8; padding: 40px 20px; box-sizing: border-box; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #eaeaea; }
          .content { padding: 40px; background-color: #ffffff; }
          .content p { font-size: 15px; color: #3f3f46; margin-bottom: 20px; line-height: 1.6; }
          .content h2 { font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 16px; margin-top: 32px; letter-spacing: -0.01em; }
          .content h2:first-child { margin-top: 0; }
          .info-card { background-color: #f4f4f5; border-radius: 8px; padding: 24px; margin: 24px 0; border: 1px solid #e4e4e7; }
          .footer { padding: 32px 40px; text-align: center; background-color: #fafafa; border-top: 1px solid #f4f4f5; }
          .footer p { font-size: 12px; color: #a1a1aa; margin-bottom: 8px; line-height: 1.5; }
          @media only screen and (max-width: 600px) {
            .wrapper { padding: 20px 10px !important; }
            .content { padding: 24px 20px !important; }
            .footer { padding: 24px 20px !important; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div style="display: none; max-height: 0px; overflow: hidden;">O seu bilhete de acesso está pronto.</div>
          <div class="container">
            ${ticketHeader}
            <div class="content">
              ${betaBanner}
              ${bodyContent}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} EasyTickets. Todos os direitos reservados.</p>
              <p>Este é um email gerado automaticamente com anexos importantes.</p>
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
    <h2>Transferência de bilhete</h2>
    <p>Olá <strong>${variables.recipientName}</strong>,</p>
    <p>O utilizador <strong>${variables.senderName}</strong> acabou de lhe transferir um bilhete para um próximo evento.</p>
    
    <div class="info-card">
      <p><strong>Evento:</strong><br>${variables.eventTitle}</p>
      <p><strong>Data:</strong><br>${variables.eventDate}</p>
      <p><strong>Enviado por:</strong><br>${variables.senderName}</p>
    </div>
    
    <p>Para adicionar o bilhete à sua conta ou descarregá-lo, por favor aceite a transferência através do botão abaixo:</p>
    
    <div class="button-wrap">
      <a href="${variables.acceptUrl}" class="button">Aceitar Bilhete</a>
    </div>
    
    <p class="meta-text">Ou copie e cole este link no seu navegador:</p>
    <p class="meta-text" style="word-break: break-all;"><a href="${variables.acceptUrl}">${variables.acceptUrl}</a></p>
    
    ${variables.expiresIn ? `<p class="meta-text" style="margin-top: 16px;">Este link de transferência expira em ${variables.expiresIn}.</p>` : ""}
    <p class="meta-text" style="margin-top: 16px;">Se não conhece o remetente ou não espera receber este bilhete, pode ignorar este email com segurança.</p>
  `;

  return {
    subject: `${variables.senderName} enviou-lhe um bilhete para ${variables.eventTitle}`,
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
    <h2>Convite para equipa</h2>
    <p>Olá,</p>
    <p>Foi convidado(a) para se juntar à organização profissional <strong>${variables.organizationName}</strong> na plataforma EasyTickets.</p>
    
    <div class="info-card">
      <p>Como membro da equipa, poderá ajudar a criar e gerir eventos, participar no controlo de acessos (validação de bilhetes) e consultar métricas de vendas, com base no seu nível de permissões.</p>
    </div>
    
    <div class="button-wrap">
      <a href="${variables.acceptUrl}" class="button">Aceitar Convite</a>
    </div>
    
    <p class="meta-text">Ou copie e cole este link no seu navegador:</p>
    <p class="meta-text" style="word-break: break-all;"><a href="${variables.acceptUrl}">${variables.acceptUrl}</a></p>
    
    ${variables.expiresIn ? `<p class="meta-text" style="margin-top: 16px;">Este convite expira em ${variables.expiresIn}.</p>` : ""}
    <p class="meta-text" style="margin-top: 16px;">Se não conhece esta organização, pode ignorar este email de forma segura.</p>
  `;

  return {
    subject: `Convite para integrar a organização ${variables.organizationName}`,
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
    <h2>Falta pouco tempo!</h2>
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>É já amanhã! Este é um lembrete automático de que o evento <strong>${variables.eventTitle}</strong> começa em menos de 24 horas.</p>
    
    <div class="info-card">
      <p><strong>Evento:</strong><br>${variables.eventTitle}</p>
      <p><strong>Data de Ínicio:</strong><br>${variables.eventDate}</p>
      <p><strong>Recinto:</strong><br>${variables.venueName}</p>
      <p><strong>Localização:</strong><br>${variables.address}</p>
    </div>
    
    <p>Certifique-se de que tem os seus bilhetes digitais prontos e acessíveis no seu telemóvel para rápida validação à entrada.</p>
    
    <div class="button-wrap">
      <a href="${variables.ticketUrl}" class="button">Aceder aos meus bilhetes</a>
    </div>
    
    <p>Desejamos-lhe um excelente espetáculo!</p>
  `;

  return {
    subject: `Lembrete: O evento ${variables.eventTitle} é amanhã!`,
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
    <h2>Obrigado pela sua presença</h2>
    <p>Olá <strong>${variables.name}</strong>,</p>
    <p>Esperamos que tenha desfrutado do evento <strong>${variables.eventTitle}</strong> ao máximo!</p>
    <p>Obrigado por ter escolhido a EasyTickets para garantir a sua presença e por fazer parte desta incrível experiência.</p>
    
    ${variables.feedbackUrl ? `
    <div class="info-card">
      <p><strong>A sua opinião importa</strong><br>Trabalhamos constantemente com os promotores para melhorar a qualidade dos eventos. Se tiver disponibilidade, agradeceríamos muito que partilhasse a sua opinião brevemente connosco.</p>
    </div>
    <div class="button-wrap">
      <a href="${variables.feedbackUrl}" class="button">Avaliar Evento</a>
    </div>
    ` : ""}
    
    <p>Até à próxima e contamos consigo em futuros eventos!</p>
  `;

  return {
    subject: `Obrigado por ir ao evento: ${variables.eventTitle}`,
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
    ? variables.upcomingEvents.map(e => `
        <div style="padding: 12px 0; border-bottom: 1px solid #e4e4e7;">
          <p style="margin: 0; font-weight: 600; color: #18181b; font-size: 15px;">${e.title}</p>
          <p style="margin: 4px 0 0 0; color: #71717a; font-size: 13px;">Data: ${e.date} &nbsp;•&nbsp; <strong style="color: #19c37d;">${e.sold} vendidas</strong></p>
        </div>
      `).join("")
    : "<p style=\"color: #71717a; font-size: 14px;\">Sem eventos ativos nas próximas datas.</p>";

  const content = `
    <h2>Relatório Diário de Vendas</h2>
    <p>Olá <strong>${variables.promoterName}</strong>,</p>
    <p>Aqui está o resumo diário automatizado referente às vendas consolidadas da sua organização até à data de <strong>${variables.date}</strong>.</p>
    
    <div class="info-card" style="border-left: 4px solid #19c37d; text-align: center;">
      <h3 style="margin-top: 0; color: #71717a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Receita de Bilheteira (24h)</h3>
      <p style="font-size: 32px; font-weight: 800; color: #18181b; margin: 12px 0;">${variables.totalSales}</p>
      <p style="font-size: 14px; color: #52525b; margin: 0;"><strong>${variables.ticketsSold}</strong> inscrições transacionadas</p>
    </div>

    <h3 style="font-size: 16px; font-weight: 600; color: #18181b; margin: 32px 0 16px 0; border-bottom: 2px solid #f4f4f5; padding-bottom: 8px;">Breakdown Próximos Eventos</h3>
    <div style="background-color: #ffffff;">
      ${eventsHtml}
    </div>

    <div class="button-wrap">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tickets.daowave.pt'}/promotor" class="button">Abrir Dashboard</a>
    </div>
  `;

  return {
    subject: `Resumo de Vendas: ${variables.totalSales} gerados`,
    html: getBaseTemplate(content, false), // No beta banner for daily reports generally.
    text: `Olá ${variables.promoterName},\n\nReceita de hoje: ${variables.totalSales}\nBilhetes: ${variables.ticketsSold}\n\nAceda ao dashboard para mais detalhes.`,
  };
}
