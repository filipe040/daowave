/**
 * Transactional Email Templates
 * Light & Vibrant — GoPass Brand (matches public website)
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
const BRAND = "GoPass";

/** Design tokens — high contrast on light background */
export const EMAIL = {
  accent: "#7c3aed",
  accentDark: "#6d28d9",
  accent2: "#d946ef",
  bg: "#f4f4f5",
  surface: "#ffffff",
  surfaceMuted: "#fafafa",
  border: "#e4e4e7",
  text: "#171717",
  textSecondary: "#525252",
  textMuted: "#737373",
  link: "#7c3aed",
  success: "#059669",
  danger: "#dc2626",
  warnBg: "#fef9c3",
  warnBorder: "#fde047",
  warnText: "#854d0e",
  infoBg: "#eff6ff",
  infoBorder: "#bfdbfe",
  infoText: "#1e40af",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#991b1b",
} as const;

function betaBannerHtml(): string {
  return `<tr><td style="padding:0 0 24px 0"><div style="background:${EMAIL.warnBg};border:1px solid ${EMAIL.warnBorder};border-radius:10px;padding:12px 16px;text-align:center;font-size:13px;font-weight:700;color:${EMAIL.warnText};letter-spacing:.03em">⚠️ Ambiente beta — plataforma em testes</div></td></tr>`;
}

function sharedStyles(primary = EMAIL.accent): string {
  return `
*,*::before,*::after{box-sizing:border-box}
body,p,h1,h2,h3,h4,ul,li{margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.6;background:${EMAIL.bg};color:${EMAIL.text};-webkit-font-smoothing:antialiased}
table{border-collapse:collapse}
img{display:block;max-width:100%;height:auto;border:0}
a{color:${EMAIL.link};text-decoration:none;font-weight:600}
.wrapper{width:100%;background:${EMAIL.bg};padding:40px 16px}
.container{max-width:600px;margin:0 auto;background:${EMAIL.surface};border:1px solid ${EMAIL.border};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,.08)}
.accent-bar{height:4px;background:linear-gradient(90deg,${EMAIL.accent} 0%,${EMAIL.accent2} 100%)}
.header{background:${EMAIL.surface};padding:32px 40px 28px;text-align:center;border-bottom:1px solid ${EMAIL.border}}
.logo{font-size:26px;font-weight:900;color:${EMAIL.text};letter-spacing:-.04em}
.logo span{background:linear-gradient(135deg,${EMAIL.accent},${EMAIL.accent2});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tagline{font-size:11px;color:${EMAIL.textMuted};margin-top:6px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.body{padding:36px 40px}
.body p{font-size:15px;color:${EMAIL.textSecondary};margin-bottom:18px;line-height:1.65}
.body h2{font-size:22px;font-weight:800;color:${EMAIL.text};margin:0 0 16px 0;letter-spacing:-.03em}
.body .lead{font-size:16px;color:${EMAIL.text};font-weight:500}
.btn-wrap{text-align:center;margin:28px 0}
.btn{display:inline-block;background:linear-gradient(135deg,${EMAIL.accent} 0%,${EMAIL.accent2} 100%);color:#ffffff!important;font-size:15px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none!important;letter-spacing:-.01em;box-shadow:0 4px 14px rgba(124,58,237,.35)}
.btn-danger{background:linear-gradient(135deg,#dc2626 0%,#ef4444 100%)!important;box-shadow:0 4px 14px rgba(220,38,38,.3)!important}
.btn-secondary{background:${EMAIL.surface}!important;border:2px solid ${EMAIL.border}!important;color:${EMAIL.text}!important;box-shadow:none!important}
.card{background:${EMAIL.surfaceMuted};border:1px solid ${EMAIL.border};border-radius:12px;padding:24px;margin:24px 0}
.card-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid ${EMAIL.border}}
.card-row:last-child{border-bottom:none;padding-bottom:0}
.card-label{font-size:11px;color:${EMAIL.textMuted};text-transform:uppercase;letter-spacing:.06em;font-weight:700;min-width:90px;padding-top:2px}
.card-value{font-size:14px;color:${EMAIL.text};font-weight:600;flex:1}
.alert{border-radius:10px;padding:16px 20px;margin:20px 0;font-size:14px;line-height:1.6}
.alert-warn{background:${EMAIL.warnBg};border:1px solid ${EMAIL.warnBorder};color:${EMAIL.warnText}}
.alert-info{background:${EMAIL.infoBg};border:1px solid ${EMAIL.infoBorder};color:${EMAIL.infoText}}
.alert-danger{background:${EMAIL.dangerBg};border:1px solid ${EMAIL.dangerBorder};color:${EMAIL.dangerText}}
.divider{height:1px;background:${EMAIL.border};margin:28px 0}
.meta{font-size:13px!important;color:${EMAIL.textMuted}!important}
.footer{padding:28px 40px;text-align:center;background:${EMAIL.surfaceMuted};border-top:1px solid ${EMAIL.border}}
.footer p{font-size:12px;color:${EMAIL.textMuted};margin-bottom:6px;line-height:1.5}
.footer a{color:${EMAIL.link};font-weight:600}
@media only screen and (max-width:600px){
  .wrapper{padding:16px 8px!important}
  .body,.header,.footer{padding:28px 20px!important}
  .btn{display:block;text-align:center}
}`;
}

function base(preheader: string, content: string, betaBanner = false): string {
  const beta = betaBanner ? betaBannerHtml() : "";

  return `<!DOCTYPE html>
<html lang="pt" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${BRAND}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>${sharedStyles()}</style>
</head>
<body>
<div class="wrapper">
  <div style="display:none;max-height:0;overflow:hidden">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <div class="container">
    <div class="accent-bar"></div>
    <div class="header">
      <div class="logo">GO<span>PASS</span></div>
      <div class="tagline">Bilhética &amp; acesso</div>
    </div>
    <div class="body">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${beta}
        <tr><td>${content}</td></tr>
      </table>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${BRAND} — Todos os direitos reservados.</p>
      <p>Este é um email automático. Por favor não responda.</p>
      <p><a href="${APP_URL}">tickets.daowave.pt</a> · <a href="mailto:suporte@gopass.pt">suporte@gopass.pt</a></p>
    </div>
  </div>
</div>
</body>
</html>`;
}

function ticketShell(preheader: string, hero: string, content: string, betaBanner = false): string {
  const beta = betaBanner
    ? `<div style="background:${EMAIL.warnBg};border:1px solid ${EMAIL.warnBorder};border-radius:10px;padding:12px 16px;margin-bottom:24px;text-align:center;font-size:13px;font-weight:700;color:${EMAIL.warnText}">⚠️ Ambiente beta</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${BRAND}</title>
<style>${sharedStyles()}</style>
</head>
<body>
<div class="wrapper">
  <div style="display:none;max-height:0;overflow:hidden">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <div class="container">
    <div class="accent-bar"></div>
    ${hero}
    <div class="body">
      ${beta}
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${BRAND} — Todos os direitos reservados.</p>
      <p><a href="${APP_URL}">tickets.daowave.pt</a></p>
    </div>
  </div>
</div>
</body>
</html>`;
}

export function getVerifyEmailTemplate(v: {
  name: string;
  verificationUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Confirme o seu email</h2>
<p class="lead">Olá <strong style="color:${EMAIL.text}">${v.name}</strong>,</p>
<p>Obrigado por criar a sua conta na <strong style="color:${EMAIL.text}">${BRAND}</strong>. Para ativar a sua conta, clique no botão abaixo.</p>
<div class="btn-wrap">
  <a href="${v.verificationUrl}" class="btn">Confirmar email</a>
</div>
<p class="meta">Ou copie e cole este link no seu navegador:</p>
<p class="meta" style="word-break:break-all"><a href="${v.verificationUrl}">${v.verificationUrl}</a></p>
${v.expiresIn ? `<div class="divider"></div><p class="meta">⏱ Este link expira em <strong style="color:${EMAIL.text}">${v.expiresIn}</strong>.</p>` : ""}
<p class="meta">Se não criou uma conta, pode ignorar este email.</p>`;

  return {
    subject: `Confirme o seu email — ${BRAND}`,
    html: base("Confirme o seu endereço de email para ativar a sua conta.", content, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\nConfirme o seu email: ${v.verificationUrl}`,
  };
}

export function getPasswordResetEmailTemplate(v: {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Redefinir palavra-passe</h2>
<p class="lead">Olá <strong style="color:${EMAIL.text}">${v.name}</strong>,</p>
<p>Recebemos um pedido para redefinir a palavra-passe da sua conta. Se foi você, clique no botão abaixo.</p>
<div class="btn-wrap">
  <a href="${v.resetUrl}" class="btn">Redefinir palavra-passe</a>
</div>
<p class="meta">Ou copie e cole este link no seu navegador:</p>
<p class="meta" style="word-break:break-all"><a href="${v.resetUrl}">${v.resetUrl}</a></p>
${v.expiresIn ? `<div class="divider"></div><p class="meta">⏱ Este link expira em <strong style="color:${EMAIL.text}">${v.expiresIn}</strong>.</p>` : ""}
<div class="alert alert-warn" style="margin-top:20px">
  <strong>🔒 Não foi você?</strong><br>Se não solicitou esta alteração, ignore este email. A sua palavra-passe continua segura.
</div>`;

  return {
    subject: `Redefinir palavra-passe — ${BRAND}`,
    html: base("Pedido de redefinição de palavra-passe.", content, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\nRedefinir palavra-passe: ${v.resetUrl}`,
  };
}

export function getOrderConfirmationEmailTemplate(v: {
  name: string;
  orderId: string;
  eventTitle: string;
  total: string;
  currency?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Pagamento confirmado ✓</h2>
<p class="lead">Olá <strong style="color:${EMAIL.text}">${v.name}</strong>,</p>
<p>A sua encomenda foi processada com sucesso. Os seus bilhetes eletrónicos serão enviados em breve.</p>
<div class="card">
  <div class="card-row"><span class="card-label">Evento</span><span class="card-value">${v.eventTitle}</span></div>
  <div class="card-row"><span class="card-label">Encomenda</span><span class="card-value" style="font-family:monospace;letter-spacing:.05em">${v.orderId.substring(0, 8).toUpperCase()}</span></div>
  <div class="card-row"><span class="card-label">Total</span><span class="card-value" style="color:${EMAIL.accent};font-size:18px">${v.total} ${v.currency || "EUR"}</span></div>
</div>
<div class="btn-wrap">
  <a href="${APP_URL}/my-tickets" class="btn">Ver os meus bilhetes</a>
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

export function getTicketEmailTemplate(v: {
  name: string;
  eventTitle: string;
  eventDate: string;
  venueName: string;
  address: string;
  ticketCount: number;
  downloadLink?: string;
  hasPdfAttachments?: boolean;
  branding?: TicketEmailBranding | null;
  ticketCode?: string | null;
  qrCodeImageUrl?: string | null;
}): { subject: string; html: string; text: string } {
  const primary = v.branding?.primaryColor || EMAIL.accent;
  const headerTitle = v.branding?.headerTitle?.trim() || "O seu bilhete de acesso";
  const bannerUrl = v.branding?.bannerUrl?.trim();

  const hero = bannerUrl
    ? `<div style="width:100%;overflow:hidden;border-bottom:1px solid ${EMAIL.border}">
         <img src="${bannerUrl}" alt="Banner do evento" style="width:100%;max-height:200px;object-fit:cover;display:block">
         <div style="background:${EMAIL.surface};padding:20px 40px;text-align:center">
           <p style="margin:0;font-size:20px;font-weight:800;color:${EMAIL.text};letter-spacing:-.02em">${headerTitle}</p>
         </div>
       </div>`
    : `<div style="background:linear-gradient(135deg,${primary}18 0%,${EMAIL.surfaceMuted} 100%);padding:36px 40px;text-align:center;border-bottom:1px solid ${EMAIL.border}">
         <div style="display:inline-block;background:${EMAIL.surface};border:1px solid ${EMAIL.border};border-radius:14px;padding:14px 22px;margin-bottom:14px;box-shadow:0 2px 8px rgba(15,23,42,.06)">
           <span style="font-size:28px">🎫</span>
         </div>
         <p style="margin:0;font-size:22px;font-weight:800;color:${EMAIL.text};letter-spacing:-.02em">${headerTitle}</p>
       </div>`;

  const qrSection = v.qrCodeImageUrl || v.ticketCode ? `
<div style="text-align:center;margin:28px 0;padding:28px;background:${EMAIL.surfaceMuted};border:1px solid ${EMAIL.border};border-radius:12px">
  <p style="font-size:11px;color:${EMAIL.textMuted};text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:20px">Código QR de acesso</p>
  ${v.qrCodeImageUrl ? `<img src="${v.qrCodeImageUrl}" alt="QR Code" width="180" height="180" style="margin:0 auto 16px;border-radius:8px;background:#fff;padding:8px;border:1px solid ${EMAIL.border}">` : ""}
  ${v.ticketCode ? `<p style="font-family:monospace;font-size:22px;font-weight:800;color:${EMAIL.text};letter-spacing:.12em">${v.ticketCode}</p>` : ""}
</div>` : "";

  const downloadSection = v.hasPdfAttachments
    ? `<div class="alert alert-info">📎 <strong>Documentos em anexo:</strong> Encontrará o(s) bilhete(s) em PDF e a fatura/recibo neste email.</div>`
    : v.downloadLink
      ? `<div class="btn-wrap"><a href="${v.downloadLink}" class="btn">Descarregar bilhete(s) PDF</a></div>
         <p class="meta" style="text-align:center">Recomendamos descarregar antes de chegar ao recinto.</p>`
      : "";

  const bodyContent = `
<h2 style="margin-bottom:8px">Bilhete(s) confirmado(s) ✓</h2>
<p class="lead">Olá <strong style="color:${EMAIL.text}">${v.name}</strong>,</p>
<p>Os seus bilhetes para <strong style="color:${EMAIL.text}">${v.eventTitle}</strong> estão prontos! Apresente o QR Code à entrada do recinto.</p>
${qrSection}
<div class="card">
  <div class="card-row"><span class="card-label">Evento</span><span class="card-value">${v.eventTitle}</span></div>
  <div class="card-row"><span class="card-label">Data</span><span class="card-value">${v.eventDate}</span></div>
  <div class="card-row"><span class="card-label">Local</span><span class="card-value">${v.venueName}</span></div>
  ${v.address ? `<div class="card-row"><span class="card-label">Morada</span><span class="card-value">${v.address}</span></div>` : ""}
  <div class="card-row"><span class="card-label">Bilhetes</span><span class="card-value" style="color:${primary}">${v.ticketCount} bilhete(s)</span></div>
</div>
${downloadSection}
<div class="alert alert-info">📱 <strong>Na entrada:</strong> Apresente o QR Code neste email (ou no PDF) no smartphone. Aumente o brilho do ecrã para facilitar a leitura.</div>`;

  return {
    subject: `🎫 Os seus bilhetes para ${v.eventTitle}`,
    html: ticketShell(`Os seus bilhetes para ${v.eventTitle} estão prontos!`, hero, bodyContent, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\nOs seus bilhetes para ${v.eventTitle}\nData: ${v.eventDate}\nLocal: ${v.venueName}${v.ticketCode ? `\nCódigo: ${v.ticketCode}` : ""}`,
  };
}

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
<p class="lead">Olá <strong style="color:${EMAIL.text}">${v.name}</strong>,</p>
<p>Detetámos um novo acesso à sua conta ${BRAND}. Se foi você, não é necessária nenhuma ação.</p>
<div class="card">
  <p style="font-size:11px;color:${EMAIL.textMuted};text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:16px">Detalhes do acesso</p>
  <div class="card-row"><span class="card-label">⏱ Data/Hora</span><span class="card-value">${v.timestamp}</span></div>
  <div class="card-row"><span class="card-label">🌐 IP</span><span class="card-value" style="font-family:monospace">${v.ip}</span></div>
  <div class="card-row"><span class="card-label">💻 Dispositivo</span><span class="card-value">${v.device}</span></div>
  <div class="card-row"><span class="card-label">📍 Local</span><span class="card-value">${v.location}</span></div>
</div>
<div class="alert alert-danger"><strong>⚠️ Não foi você?</strong><br>Altere a sua palavra-passe imediatamente para proteger a sua conta.</div>
<div class="btn-wrap"><a href="${v.resetUrl}" class="btn btn-danger">Alterar palavra-passe agora</a></div>
<p class="meta" style="text-align:center">Este link de segurança expira em 1 hora.</p>
<div class="divider"></div>
<p class="meta">Se foi você a entrar, pode ignorar este email.</p>`;

  return {
    subject: `🔐 Novo acesso à sua conta — ${BRAND}`,
    html: base("Novo acesso detetado na sua conta GoPass.", content, false),
    text: `Olá ${v.name},\n\nNovo acesso à sua conta GoPass.\nData: ${v.timestamp}\nIP: ${v.ip}\n\nNão foi você? ${v.resetUrl}`,
  };
}

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
<p class="lead">Olá <strong style="color:${EMAIL.text}">${v.recipientName}</strong>,</p>
<p><strong style="color:${EMAIL.text}">${v.senderName}</strong> transferiu-lhe um bilhete para o seguinte evento:</p>
<div class="card">
  <div class="card-row"><span class="card-label">Evento</span><span class="card-value">${v.eventTitle}</span></div>
  <div class="card-row"><span class="card-label">Data</span><span class="card-value">${v.eventDate}</span></div>
  <div class="card-row"><span class="card-label">De</span><span class="card-value">${v.senderName}</span></div>
</div>
<div class="btn-wrap"><a href="${v.acceptUrl}" class="btn">Aceitar bilhete</a></div>
<p class="meta" style="text-align:center">Ou copie: <a href="${v.acceptUrl}">${v.acceptUrl}</a></p>
${v.expiresIn ? `<p class="meta" style="text-align:center">⏱ Expira em <strong style="color:${EMAIL.text}">${v.expiresIn}</strong>.</p>` : ""}
<p class="meta">Se não conhece o remetente, pode ignorar este email.</p>`;

  return {
    subject: `🎫 ${v.senderName} enviou-lhe um bilhete para ${v.eventTitle}`,
    html: base(`${v.senderName} transferiu um bilhete para ${v.eventTitle}.`, content, getConfig().mode === "public_beta"),
    text: `Olá ${v.recipientName},\n\n${v.senderName} transferiu um bilhete para ${v.eventTitle}.\nAceitar: ${v.acceptUrl}`,
  };
}

export function getOrganizationInviteTemplate(v: {
  organizationName: string;
  acceptUrl: string;
  expiresIn?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Convite para equipa</h2>
<p>Foi convidado(a) para se juntar à organização <strong style="color:${EMAIL.text}">${v.organizationName}</strong> na plataforma ${BRAND}.</p>
<div class="card">
  <p style="color:${EMAIL.textSecondary};font-size:14px;margin:0">Como membro da equipa poderá ajudar a criar e gerir eventos, participar no controlo de acessos e consultar métricas de vendas.</p>
</div>
<div class="btn-wrap"><a href="${v.acceptUrl}" class="btn">Aceitar convite</a></div>
<p class="meta" style="text-align:center">Ou copie: <a href="${v.acceptUrl}">${v.acceptUrl}</a></p>
${v.expiresIn ? `<p class="meta" style="text-align:center">⏱ Expira em <strong style="color:${EMAIL.text}">${v.expiresIn}</strong>.</p>` : ""}
<p class="meta">Se não conhece esta organização, pode ignorar este email.</p>`;

  return {
    subject: `Convite para integrar ${v.organizationName} — ${BRAND}`,
    html: base(`Convite para a organização ${v.organizationName}.`, content, getConfig().mode === "public_beta"),
    text: `Foi convidado para a organização ${v.organizationName}.\nAceitar: ${v.acceptUrl}`,
  };
}

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
<p class="lead">Olá <strong style="color:${EMAIL.text}">${v.name}</strong>,</p>
<p>Lembrete: o evento <strong style="color:${EMAIL.text}">${v.eventTitle}</strong> começa em menos de 24 horas!</p>
<div class="card">
  <div class="card-row"><span class="card-label">Evento</span><span class="card-value">${v.eventTitle}</span></div>
  <div class="card-row"><span class="card-label">Data</span><span class="card-value">${v.eventDate}</span></div>
  <div class="card-row"><span class="card-label">Local</span><span class="card-value">${v.venueName}</span></div>
  <div class="card-row"><span class="card-label">Morada</span><span class="card-value">${v.address}</span></div>
</div>
<div class="btn-wrap"><a href="${v.ticketUrl}" class="btn">Ver os meus bilhetes</a></div>
<p>Certifique-se de ter os bilhetes acessíveis no smartphone. Bom espetáculo! 🎉</p>`;

  return {
    subject: `⏰ Amanhã: ${v.eventTitle}`,
    html: base(`O evento ${v.eventTitle} é amanhã!`, content, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\n\nO evento ${v.eventTitle} é amanhã!\nVer bilhetes: ${v.ticketUrl}`,
  };
}

export function getPostEventThankYouTemplate(v: {
  name: string;
  eventTitle: string;
  feedbackUrl?: string;
}): { subject: string; html: string; text: string } {
  const content = `
<h2>Obrigado pela sua presença! 🎉</h2>
<p class="lead">Olá <strong style="color:${EMAIL.text}">${v.name}</strong>,</p>
<p>Esperamos que tenha desfrutado do <strong style="color:${EMAIL.text}">${v.eventTitle}</strong>. Obrigado por fazer parte deste momento!</p>
${v.feedbackUrl ? `
<div class="card"><p style="color:${EMAIL.textSecondary};font-size:14px;margin:0">A sua opinião ajuda-nos a melhorar. Se tiver um momento, adorávamos saber o que achou do evento.</p></div>
<div class="btn-wrap"><a href="${v.feedbackUrl}" class="btn btn-secondary">Avaliar o evento</a></div>` : ""}
<p>Até à próxima! Fique atento(a) a futuros eventos em <a href="${APP_URL}">${APP_URL}</a>.</p>`;

  return {
    subject: `Obrigado por participar em ${v.eventTitle}!`,
    html: base(`Obrigado por participar em ${v.eventTitle}!`, content, getConfig().mode === "public_beta"),
    text: `Olá ${v.name},\n\nObrigado por participar em ${v.eventTitle}!`,
  };
}

export function getPromoterDailyReportTemplate(v: {
  promoterName: string;
  date: string;
  totalSales: string;
  ticketsSold: number;
  upcomingEvents: Array<{ title: string; date: string; sold: number }>;
}): { subject: string; html: string; text: string } {
  const eventRows = v.upcomingEvents.length > 0
    ? v.upcomingEvents.map(e => `
<div style="padding:12px 0;border-bottom:1px solid ${EMAIL.border}">
  <p style="margin:0;font-weight:700;color:${EMAIL.text};font-size:14px">${e.title}</p>
  <p style="margin:4px 0 0;color:${EMAIL.textMuted};font-size:13px">${e.date} &nbsp;•&nbsp; <strong style="color:${EMAIL.accent}">${e.sold} vendidos</strong></p>
</div>`).join("")
    : `<p style="color:${EMAIL.textMuted};font-size:14px">Sem eventos ativos nas próximas datas.</p>`;

  const content = `
<h2>Relatório diário de vendas</h2>
<p class="lead">Olá <strong style="color:${EMAIL.text}">${v.promoterName}</strong>,</p>
<p>Resumo das vendas até <strong style="color:${EMAIL.text}">${v.date}</strong>.</p>
<div class="card" style="text-align:center;border-left:4px solid ${EMAIL.accent}">
  <p style="font-size:12px;color:${EMAIL.textMuted};text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin-bottom:8px">Receita (24h)</p>
  <p style="font-size:36px;font-weight:900;color:${EMAIL.text};margin:8px 0;letter-spacing:-.03em">${v.totalSales}</p>
  <p style="font-size:14px;color:${EMAIL.textMuted};margin:0"><strong style="color:${EMAIL.accent}">${v.ticketsSold}</strong> bilhetes vendidos</p>
</div>
<p style="font-size:13px;font-weight:700;color:${EMAIL.textMuted};text-transform:uppercase;letter-spacing:.05em;margin:28px 0 12px">Próximos eventos</p>
<div class="card" style="padding:0 24px">${eventRows}</div>
<div class="btn-wrap"><a href="${APP_URL}/promotor" class="btn">Abrir dashboard</a></div>`;

  return {
    subject: `📊 Relatório de vendas — ${v.totalSales} em ${v.date}`,
    html: base(`Relatório de vendas de ${v.date}.`, content, false),
    text: `Olá ${v.promoterName},\n\nReceita: ${v.totalSales}\nBilhetes: ${v.ticketsSold}\n\nDashboard: ${APP_URL}/promotor`,
  };
}
