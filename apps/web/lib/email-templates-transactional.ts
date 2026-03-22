/**
 * Transactional Email Templates
 * Premium Dark SaaS Aesthetic — DãoWave Brand
 */

import { getEmailConfig } from "./config/email";

function getConfig() {
  try {
    return getEmailConfig();
  } catch {
    return { mode: "public_beta" as const };
  }
}

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://tickets.daowave.pt";
const BRAND = "DãoWave";
const ACCENT = "#10b981"; // emerald-500
const ACCENT_DARK = "#059669";
const BG = "#09090b";
const SURFACE = "#111113";
const SURFACE2 = "#18181b";
const BORDER = "#27272a";
const TEXT_PRIMARY = "#f4f4f5";
const TEXT_SECONDARY = "#a1a1aa";
const TEXT_MUTED = "#71717a";

/**
 * BASE TEMPLATE — Dark Premium DãoWave
 */
function base(preheader: string, content: string, betaBanner = false): string {
  const beta = betaBanner
    ? `<tr><td style="padding:0 0 24px 0"><div style="background:#422006;border:1px solid #92400e;border-radius:8px;padding:12px 16px;text-align:center;font-size:13px;font-weight:700;color:#fde68a;letter-spacing:.04em">⚠️ AMBIENTE BETA — Plataforma em testes</div></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${BRAND}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
*,*::before,*::after{box-sizing:border-box}
body,p,h1,h2,h3,h4,ul,li{margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;background:${BG};color:${TEXT_PRIMARY};-webkit-font-smoothing:antialiased}
table{border-collapse:collapse}
img{display:block;max-width:100%;height:auto;border:0}
a{color:${ACCENT};text-decoration:none}
.wrapper{width:100%;background:${BG};padding:40px 16px}
.container{max-width:600px;margin:0 auto;background:${SURFACE};border:1px solid ${BORDER};border-radius:16px;overflow:hidden}
.header{background:linear-gradient(135deg,#0a0a0b 0%,#111113 100%);padding:36px 40px;text-align:center;border-bottom:1px solid ${BORDER}}
.logo{font-size:24px;font-weight:900;color:#fff;letter-spacing:-.04em}
.logo span{color:${ACCENT}}
.tagline{font-size:12px;color:${TEXT_MUTED};margin-top:4px;font-weight:500;letter-spacing:.06em;text-transform:uppercase}
.body{padding:40px}
.body p{font-size:15px;color:${TEXT_SECONDARY};margin-bottom:18px;line-height:1.65}
.body h2{font-size:22px;font-weight:800;color:${TEXT_PRIMARY};margin:0 0 20px 0;letter-spacing:-.03em}
.body .lead{font-size:16px;color:${TEXT_PRIMARY};font-weight:500}
.btn-wrap{text-align:center;margin:28px 0}
.btn{display:inline-block;background:${ACCENT};color:#fff!important;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none!important;letter-spacing:-.01em}
.btn-secondary{background:transparent;border:1px solid ${BORDER};color:${TEXT_SECONDARY}!important}
.card{background:${SURFACE2};border:1px solid ${BORDER};border-radius:12px;padding:24px;margin:24px 0}
.card-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid ${BORDER}}
.card-row:last-child{border-bottom:none;padding-bottom:0}
.card-label{font-size:12px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:.05em;font-weight:600;min-width:90px;padding-top:2px}
.card-value{font-size:14px;color:${TEXT_PRIMARY};font-weight:600;flex:1}
.alert{border-radius:10px;padding:16px 20px;margin:20px 0;font-size:14px;line-height:1.6}
.alert-warn{background:#422006;border:1px solid #92400e;color:#fde68a}
.alert-info{background:#0c1a2e;border:1px solid #1e3a5f;color:#93c5fd}
.alert-danger{background:#310d0d;border:1px solid #7f1d1d;color:#fca5a5}
.divider{height:1px;background:${BORDER};margin:28px 0}
.meta{font-size:13px!important;color:${TEXT_MUTED}!important}
.footer{padding:28px 40px;text-align:center;background:${BG};border-top:1px solid ${BORDER}}
.footer p{font-size:12px;color:${TEXT_MUTED};margin-bottom:6px;line-height:1.5}
.footer a{color:${TEXT_MUTED}}
@media only screen and (max-width:600px){
  .wrapper{padding:16px 8px!important}
  .body,.header,.footer{padding:28px 20px!important}
  .btn{display:block;text-align:center}
}
</style>
</head>
<body>
<div class="wrapper">
  <div style="display:none;max-height:0;overflow:hidden">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <div class="container">
    <div class="header">
      <div class="logo">DÃO<span>WAVE</span></div>
      <div class="tagline">Bilhética digital</div>
    </div>
    <div class="body">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${beta}
        <tr><td>${content}</td></tr>
      </table>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${BRAND} &mdash; Todos os direitos reservados.</p>
      <p>Este é um email automático. Por favor não responda.</p>
      <p><a href="${APP_URL}">tickets.wwave.pt</a></p>
    </div>
  </div>
</div>
</body>
</html>`;
}

/**
 * Verify Email
 */
export function getVerifyEmailTemplate(v: {
  name: string;
  verificationUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Confirme o seu email</h2>
<p class="lead">Olá <strong style="color:${TEXT_PRIMARY}">${v.name}</strong>,</p>
<p>Obrigado por criar a sua conta na <strong style="color:${TEXT_PRIMARY}">${BRAND}</strong>. Para ativar a sua conta, clique no botão abaixo.</p>
<div class="btn-wrap">
  <a href="${v.verificationUrl}" class="btn">Confirmar email</a>
</div>
<p class="meta">Ou copie e cole este link no seu navegador:</p>
<p class="meta" style="word-break:break-all"><a href="${v.verificationUrl}">${v.verificationUrl}</a></p>
${v.expiresIn ? `<div class="divider"></div><p class="meta">⏱ Este link expira em <strong>${v.expiresIn}</strong>.</p>` : ""}
<p class="meta">Se não criou uma conta, pode ignorar este email.</p>`;

  return {
    subject: `Confirme o seu email — ${BRAND}`,
    html: base("Confirme o seu endereço de email para ativar a sua conta.", content, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\nConfirme o seu email: ${v.verificationUrl}`,
  };
}

/**
 * Password Reset
 */
export function getPasswordResetEmailTemplate(v: {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Redefinir palavra-passe</h2>
<p class="lead">Olá <strong style="color:${TEXT_PRIMARY}">${v.name}</strong>,</p>
<p>Recebemos um pedido para redefinir a palavra-passe da sua conta. Se foi você, clique no botão abaixo.</p>
<div class="btn-wrap">
  <a href="${v.resetUrl}" class="btn">Redefinir palavra-passe</a>
</div>
<p class="meta">Ou copie e cole este link no seu navegador:</p>
<p class="meta" style="word-break:break-all"><a href="${v.resetUrl}">${v.resetUrl}</a></p>
${v.expiresIn ? `<div class="divider"></div><p class="meta">⏱ Este link expira em <strong>${v.expiresIn}</strong>.</p>` : ""}
<div class="alert alert-warn" style="margin-top:20px">
  <strong>🔒 Não foi você?</strong><br>Se não solicitou esta alteração, ignore este email. A sua palavra-passe continua segura e não será alterada.
</div>`;

  return {
    subject: `Redefinir palavra-passe — ${BRAND}`,
    html: base("Pedido de redefinição de palavra-passe.", content, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\nRedefinir palavra-passe: ${v.resetUrl}`,
  };
}

/**
 * Order Confirmation
 */
export function getOrderConfirmationEmailTemplate(v: {
  name: string;
  orderId: string;
  eventTitle: string;
  total: string;
  currency?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Pagamento confirmado ✓</h2>
<p class="lead">Olá <strong style="color:${TEXT_PRIMARY}">${v.name}</strong>,</p>
<p>A sua encomenda foi processada com sucesso. Os seus bilhetes eletrónicos serão enviados em breve.</p>

<div class="card">
  <div class="card-row">
    <span class="card-label">Evento</span>
    <span class="card-value">${v.eventTitle}</span>
  </div>
  <div class="card-row">
    <span class="card-label">Encomenda</span>
    <span class="card-value" style="font-family:monospace;letter-spacing:.05em">${v.orderId.substring(0, 8).toUpperCase()}</span>
  </div>
  <div class="card-row">
    <span class="card-label">Total</span>
    <span class="card-value" style="color:${ACCENT};font-size:18px">${v.total} ${v.currency || "EUR"}</span>
  </div>
</div>

<div class="btn-wrap">
  <a href="${APP_URL}/account/tickets" class="btn">Ver os meus bilhetes</a>
</div>
<p class="meta" style="text-align:center">Os bilhetes com QR Code serão enviados separadamente.</p>`;

  return {
    subject: `✓ Compra confirmada — ${v.eventTitle}`,
    html: base(`Encomenda confirmada para ${v.eventTitle}.`, content, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\nEncomenda ${v.orderId} confirmada.\nEvento: ${v.eventTitle}\nTotal: ${v.total} ${v.currency || "EUR"}`,
  };
}

export type TicketEmailBranding = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  bannerUrl?: string | null;
  headerTitle?: string | null;
};

/**
 * Ticket Delivery
 */
export function getTicketEmailTemplate(v: {
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
  const primary = v.branding?.primaryColor || ACCENT;
  const headerTitle = v.branding?.headerTitle?.trim() || "O seu bilhete de acesso";
  const bannerUrl = v.branding?.bannerUrl?.trim();

  const hero = bannerUrl
    ? `<div style="width:100%;height:180px;overflow:hidden;position:relative;border-bottom:1px solid ${BORDER}"><img src="${bannerUrl}" alt="Banner do Evento" style="width:100%;height:100%;object-fit:cover"></div>
       <div style="background:${BG};padding:24px 40px;text-align:center;border-bottom:1px solid ${BORDER}"><p style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-.02em">${headerTitle}</p></div>`
    : `<div style="background:linear-gradient(135deg,${primary}22 0%,${BG} 100%);padding:36px 40px;text-align:center;border-bottom:1px solid ${BORDER}">
         <div style="display:inline-block;background:${primary}22;border:1px solid ${primary}44;border-radius:12px;padding:12px 20px;margin-bottom:16px">
           <span style="font-size:28px">🎫</span>
         </div>
         <p style="margin:0;font-size:22px;font-weight:800;color:#fff;letter-spacing:-.02em">${headerTitle}</p>
       </div>`;

  const qrSection = v.qrCodeImageUrl || v.ticketCode ? `
<div style="text-align:center;margin:28px 0;padding:28px;background:${SURFACE2};border:1px solid ${BORDER};border-radius:12px">
  <p style="font-size:11px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:20px">Código QR de Acesso</p>
  ${v.qrCodeImageUrl ? `<img src="${v.qrCodeImageUrl}" alt="QR Code" width="180" height="180" style="margin:0 auto 16px;border-radius:8px;background:#fff;padding:8px">` : ""}
  ${v.ticketCode ? `<p style="font-family:monospace;font-size:22px;font-weight:800;color:${TEXT_PRIMARY};letter-spacing:.12em">${v.ticketCode}</p>` : ""}
</div>` : "";

  const downloadSection = v.downloadLink ? `
<div class="btn-wrap">
  <a href="${v.downloadLink}" class="btn">Descarregar bilhete(s) PDF</a>
</div>
<p class="meta" style="text-align:center">Recomendamos descarregar antes de chegar ao recinto.</p>` : "";

  const bodyContent = `
<h2 style="margin-bottom:8px">Bilhete(s) confirmado(s) ✓</h2>
<p class="lead">Olá <strong style="color:${TEXT_PRIMARY}">${v.name}</strong>,</p>
<p>Os seus bilhetes para <strong style="color:${TEXT_PRIMARY}">${v.eventTitle}</strong> estão prontos! Apresente o QR Code à entrada do recinto.</p>

${qrSection}

<div class="card">
  <div class="card-row"><span class="card-label">Evento</span><span class="card-value">${v.eventTitle}</span></div>
  <div class="card-row"><span class="card-label">Data</span><span class="card-value">${v.eventDate}</span></div>
  <div class="card-row"><span class="card-label">Local</span><span class="card-value">${v.venueName}</span></div>
  ${v.address ? `<div class="card-row"><span class="card-label">Morada</span><span class="card-value">${v.address}</span></div>` : ""}
  <div class="card-row"><span class="card-label">Bilhetes</span><span class="card-value" style="color:${ACCENT}">${v.ticketCount} bilhete(s)</span></div>
</div>

${downloadSection}

<div class="alert alert-info">
  📱 <strong>Na entrada do evento:</strong> Apresente o QR Code neste email (ou no PDF) diretamente no seu smartphone. Aumente o brilho do ecrã para facilitar a leitura.
</div>`;

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${BRAND}</title>
<style>
*{box-sizing:border-box}body,p,h1,h2,h3{margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;background:${BG};color:${TEXT_PRIMARY};-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%;height:auto;border:0}
.wrapper{width:100%;background:${BG};padding:40px 16px}
.container{max-width:600px;margin:0 auto;background:${SURFACE};border:1px solid ${BORDER};border-radius:16px;overflow:hidden}
.body{padding:40px}.body p{font-size:15px;color:${TEXT_SECONDARY};margin-bottom:18px;line-height:1.65}
.body h2{font-size:22px;font-weight:800;color:${TEXT_PRIMARY};margin:0 0 8px 0;letter-spacing:-.03em}
.body .lead{font-size:16px;color:${TEXT_PRIMARY};font-weight:500}.btn-wrap{text-align:center;margin:28px 0}
.btn{display:inline-block;background:${primary};color:#fff!important;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none!important}
.card{background:${SURFACE2};border:1px solid ${BORDER};border-radius:12px;padding:24px;margin:24px 0}
.card-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid ${BORDER}}
.card-row:last-child{border-bottom:none;padding-bottom:0}
.card-label{font-size:12px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:.05em;font-weight:600;min-width:80px;padding-top:2px}
.card-value{font-size:14px;color:${TEXT_PRIMARY};font-weight:600;flex:1}
.alert{border-radius:10px;padding:16px 20px;margin:20px 0;font-size:14px;line-height:1.6}
.alert-info{background:#0c1a2e;border:1px solid #1e3a5f;color:#93c5fd}
.meta{font-size:13px!important;color:${TEXT_MUTED}!important}.footer{padding:28px 40px;text-align:center;background:${BG};border-top:1px solid ${BORDER}}
.footer p{font-size:12px;color:${TEXT_MUTED};margin-bottom:6px;line-height:1.5}.footer a{color:${TEXT_MUTED}}
@media only screen and (max-width:600px){.wrapper{padding:16px 8px!important}.body,.footer{padding:28px 20px!important}.btn{display:block;text-align:center}}
</style>
</head>
<body>
<div class="wrapper">
  <div style="display:none;max-height:0;overflow:hidden">Os seus bilhetes para ${v.eventTitle} estão prontos!&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <div class="container">
    ${hero}
    <div class="body">
      ${getConfig().mode === "public_beta" ? `<div style="background:#422006;border:1px solid #92400e;border-radius:8px;padding:12px 16px;margin-bottom:24px;text-align:center;font-size:13px;font-weight:700;color:#fde68a">⚠️ AMBIENTE BETA</div>` : ""}
      ${bodyContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${BRAND} — Todos os direitos reservados.</p>
      <p><a href="${APP_URL}">tickets.daowave.pt</a></p>
    </div>
  </div>
</div>
</body>
</html>`;

  return {
    subject: `🎫 Os seus bilhetes para ${v.eventTitle}`,
    html,
    text: `Olá ${v.name},\nOs seus bilhetes para ${v.eventTitle}\nData: ${v.eventDate}\nLocal: ${v.venueName}${v.ticketCode ? `\nCódigo: ${v.ticketCode}` : ""}`,
  };
}

/**
 * Login Notification — with security info + reset link
 */
export function getLoginNotificationTemplate(v: {
  name: string;
  ip: string;
  device: string;
  location: string;
  timestamp: string;
  resetUrl: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Novo acesso à sua conta</h2>
<p class="lead">Olá <strong style="color:${TEXT_PRIMARY}">${v.name}</strong>,</p>
<p>Detetámos um novo acesso à sua conta ${BRAND}. Se foi você, não é necessária nenhuma ação.</p>

<div class="card">
  <p style="font-size:11px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:16px">Detalhes do acesso</p>
  <div class="card-row">
    <span class="card-label">⏱ Data/Hora</span>
    <span class="card-value">${v.timestamp}</span>
  </div>
  <div class="card-row">
    <span class="card-label">🌐 Endereço IP</span>
    <span class="card-value" style="font-family:monospace">${v.ip}</span>
  </div>
  <div class="card-row">
    <span class="card-label">💻 Dispositivo</span>
    <span class="card-value">${v.device}</span>
  </div>
  <div class="card-row">
    <span class="card-label">📍 Localização</span>
    <span class="card-value">${v.location}</span>
  </div>
</div>

<div class="alert alert-danger">
  <strong>⚠️ Não foi você?</strong><br>
  Se não reconhece este acesso, altere a sua palavra-passe imediatamente para proteger a sua conta.
</div>

<div class="btn-wrap">
  <a href="${v.resetUrl}" class="btn" style="background:#dc2626">Alterar palavra-passe agora</a>
</div>
<p class="meta" style="text-align:center">Este link de segurança expira em 1 hora.</p>
<div class="divider"></div>
<p class="meta">Se foi você a entrar, pode ignorar este email. A sua conta está segura.</p>`;

  return {
    subject: `🔐 Novo acesso à sua conta — ${BRAND}`,
    html: base("Novo acesso detetado na sua conta DãoWave.", content, false),
    text: `Olá ${v.name},\n\nNovo acesso à sua conta DãoWave.\nData: ${v.timestamp}\nIP: ${v.ip}\nDispositivo: ${v.device}\nLocalização: ${v.location}\n\nNão foi você? Altere a sua palavra-passe: ${v.resetUrl}`,
  };
}

/**
 * Ticket Transfer
 */
export function getTicketTransferTemplate(v: {
  recipientName: string;
  senderName: string;
  eventTitle: string;
  eventDate: string;
  acceptUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Recebeu um bilhete 🎫</h2>
<p class="lead">Olá <strong style="color:${TEXT_PRIMARY}">${v.recipientName}</strong>,</p>
<p><strong style="color:${TEXT_PRIMARY}">${v.senderName}</strong> transferiu-lhe um bilhete para o seguinte evento:</p>

<div class="card">
  <div class="card-row"><span class="card-label">Evento</span><span class="card-value">${v.eventTitle}</span></div>
  <div class="card-row"><span class="card-label">Data</span><span class="card-value">${v.eventDate}</span></div>
  <div class="card-row"><span class="card-label">De</span><span class="card-value">${v.senderName}</span></div>
</div>

<div class="btn-wrap">
  <a href="${v.acceptUrl}" class="btn">Aceitar bilhete</a>
</div>
<p class="meta" style="text-align:center">Ou copie: <a href="${v.acceptUrl}">${v.acceptUrl}</a></p>
${v.expiresIn ? `<p class="meta" style="text-align:center">⏱ Este link expira em <strong>${v.expiresIn}</strong>.</p>` : ""}
<p class="meta">Se não conhece o remetente, pode ignorar este email.</p>`;

  return {
    subject: `🎫 ${v.senderName} enviou-lhe um bilhete para ${v.eventTitle}`,
    html: base(`${v.senderName} transferiu um bilhete para ${v.eventTitle}.`, content, getConfig().mode === "public_beta"),
    text: `Olá ${v.recipientName},\n\n${v.senderName} transferiu um bilhete para ${v.eventTitle}.\nAceitar: ${v.acceptUrl}`,
  };
}

/**
 * Organization Invite
 */
export function getOrganizationInviteTemplate(v: {
  organizationName: string;
  acceptUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Convite para equipa</h2>
<p>Foi convidado(a) para se juntar à organização <strong style="color:${TEXT_PRIMARY}">${v.organizationName}</strong> na plataforma ${BRAND}.</p>

<div class="card">
  <p style="color:${TEXT_SECONDARY};font-size:14px;margin:0">Como membro da equipa poderá ajudar a criar e gerir eventos, participar no controlo de acessos e consultar métricas de vendas, conforme as permissões atribuídas.</p>
</div>

<div class="btn-wrap">
  <a href="${v.acceptUrl}" class="btn">Aceitar convite</a>
</div>
<p class="meta" style="text-align:center">Ou copie: <a href="${v.acceptUrl}">${v.acceptUrl}</a></p>
${v.expiresIn ? `<p class="meta" style="text-align:center">⏱ Este convite expira em <strong>${v.expiresIn}</strong>.</p>` : ""}
<p class="meta">Se não conhece esta organização, pode ignorar este email.</p>`;

  return {
    subject: `Convite para integrar ${v.organizationName} — ${BRAND}`,
    html: base(`Convite para a organização ${v.organizationName}.`, content, getConfig().mode === "public_beta"),
    text: `Foi convidado para a organização ${v.organizationName}.\nAceitar: ${v.acceptUrl}`,
  };
}

/**
 * Event Reminder 24h
 */
export function getEventReminderTemplate(v: {
  name: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  address: string;
  ticketUrl: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>É amanhã! ⏰</h2>
<p class="lead">Olá <strong style="color:${TEXT_PRIMARY}">${v.name}</strong>,</p>
<p>Lembrete automático: o evento <strong style="color:${TEXT_PRIMARY}">${v.eventTitle}</strong> começa em menos de 24 horas!</p>

<div class="card">
  <div class="card-row"><span class="card-label">Evento</span><span class="card-value">${v.eventTitle}</span></div>
  <div class="card-row"><span class="card-label">Data</span><span class="card-value">${v.eventDate}</span></div>
  <div class="card-row"><span class="card-label">Local</span><span class="card-value">${v.venueName}</span></div>
  <div class="card-row"><span class="card-label">Morada</span><span class="card-value">${v.address}</span></div>
</div>

<div class="btn-wrap">
  <a href="${v.ticketUrl}" class="btn">Ver os meus bilhetes</a>
</div>
<p>Certifique-se de ter os seus bilhetes acessíveis no smartphone. Bom espetáculo! 🎉</p>`;

  return {
    subject: `⏰ Amanhã: ${v.eventTitle}`,
    html: base(`O evento ${v.eventTitle} é amanhã!`, content, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\n\nO evento ${v.eventTitle} é amanhã!\nVer bilhetes: ${v.ticketUrl}`,
  };
}

/**
 * Post-Event Thank You
 */
export function getPostEventThankYouTemplate(v: {
  name: string;
  eventTitle: string;
  feedbackUrl?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Obrigado pela sua presença! 🎉</h2>
<p class="lead">Olá <strong style="color:${TEXT_PRIMARY}">${v.name}</strong>,</p>
<p>Esperamos que tenha desfrutado ao máximo do <strong style="color:${TEXT_PRIMARY}">${v.eventTitle}</strong>. Obrigado por fazer parte deste momento!</p>

${v.feedbackUrl ? `
<div class="card">
  <p style="color:${TEXT_SECONDARY};font-size:14px;margin:0">A sua opinião ajuda-nos a melhorar. Se tiver um momento, adorávamos saber o que achou do evento.</p>
</div>
<div class="btn-wrap">
  <a href="${v.feedbackUrl}" class="btn btn-secondary">Avaliar o evento</a>
</div>` : ""}

<p>Até à próxima! Fique atento(a) a futuros eventos em <a href="${APP_URL}">${APP_URL}</a>.</p>`;

  return {
    subject: `Obrigado por participar em ${v.eventTitle}!`,
    html: base(`Obrigado por participar em ${v.eventTitle}!`, content, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\n\nObrigado por participar em ${v.eventTitle}!`,
  };
}

/**
 * Promoter Daily Report
 */
export function getPromoterDailyReportTemplate(v: {
  promoterName: string;
  date: string;
  totalSales: string;
  ticketsSold: number;
  upcomingEvents: Array<{ title: string; date: string; sold: number }>;
}): { subject: string; html: string; text: string } {
  const eventRows = v.upcomingEvents.length > 0
    ? v.upcomingEvents.map(e => `
<div style="padding:12px 0;border-bottom:1px solid ${BORDER}">
  <p style="margin:0;font-weight:700;color:${TEXT_PRIMARY};font-size:14px">${e.title}</p>
  <p style="margin:4px 0 0;color:${TEXT_MUTED};font-size:13px">${e.date} &nbsp;•&nbsp; <strong style="color:${ACCENT}">${e.sold} vendidos</strong></p>
</div>`).join("")
    : `<p style="color:${TEXT_MUTED};font-size:14px">Sem eventos ativos nas próximas datas.</p>`;

  const content = `
<h2>Relatório Diário de Vendas</h2>
<p class="lead">Olá <strong style="color:${TEXT_PRIMARY}">${v.promoterName}</strong>,</p>
<p>Aqui está o resumo das vendas até <strong style="color:${TEXT_PRIMARY}">${v.date}</strong>.</p>

<div class="card" style="text-align:center;border-left:3px solid ${ACCENT}">
  <p style="font-size:12px;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin-bottom:8px">Receita de Bilheteira (24h)</p>
  <p style="font-size:36px;font-weight:900;color:${TEXT_PRIMARY};margin:8px 0;letter-spacing:-.03em">${v.totalSales}</p>
  <p style="font-size:14px;color:${TEXT_MUTED};margin:0"><strong style="color:${ACCENT}">${v.ticketsSold}</strong> bilhetes vendidos</p>
</div>

<p style="font-size:13px;font-weight:700;color:${TEXT_MUTED};text-transform:uppercase;letter-spacing:.05em;margin:28px 0 12px">Próximos Eventos</p>
<div class="card" style="padding:0 24px">
  ${eventRows}
</div>

<div class="btn-wrap">
  <a href="${APP_URL}/promotor" class="btn">Abrir Dashboard</a>
</div>`;

  return {
    subject: `📊 Relatório de Vendas — ${v.totalSales} em ${v.date}`,
    html: base(`Relatório de vendas de ${v.date}.`, content, false),
    text: `Olá ${v.promoterName},\n\nReceita de hoje: ${v.totalSales}\nBilhetes: ${v.ticketsSold}\n\nAceda ao dashboard: ${APP_URL}/promotor`,
  };
}
