import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ThemeJson, TicketRenderModel, TicketTemplatePreset } from "../ticket-templates/models";

function formatDate(date: Date) {
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt });
}

function qrSizePx(size: ThemeJson["qr"]["size"]) {
  return size === "L" ? 200 : size === "M" ? 150 : 100;
}

function qrImg(model: TicketRenderModel, size: number) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(model.ticket.qrPayload)}`;
}

function baseStyles(theme: ThemeJson, extra = "") {
  const radius =
    theme.layout?.cornerRadius === "sm" ? 8 : theme.layout?.cornerRadius === "lg" ? 24 : 16;
  const cardShadow =
    theme.layout?.cardStyle === "flat"
      ? "none"
      : theme.layout?.cardStyle === "bordered"
        ? "none"
        : "0 8px 32px rgba(0,0,0,0.08)";
  const cardBorder =
    theme.layout?.cardStyle === "bordered"
      ? `2px solid ${theme.colors.primary}44`
      : "1px solid rgba(0,0,0,0.06)";

  return `
    body {
      font-family: '${theme.typography.fontFamily}', sans-serif;
      margin: 0;
      padding: 0;
      background: ${theme.colors.bg};
      color: ${theme.colors.text};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .accent-bar {
      height: 6px;
      background: ${theme.colors.primary};
      border-radius: ${radius}px ${radius}px 0 0;
    }
    .accent-gradient {
      background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.muted}88 100%);
      padding: 24px 30px;
      color: #fff;
    }
    .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${theme.colors.muted};
      margin-bottom: 4px;
    }
    .value {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.35;
    }
    .logo { max-height: 56px; max-width: 180px; object-fit: contain; }
    .qr-code {
      background: #fff;
      padding: 10px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .qr-label {
      font-size: 13px;
      color: ${theme.colors.muted};
      margin-top: 10px;
      text-align: center;
    }
    .footer {
      font-size: 11px;
      color: ${theme.colors.muted};
      text-align: center;
      line-height: 1.6;
    }
    ${extra}
  `;
}

function infoBlocks(theme: ThemeJson, model: TicketRenderModel) {
  return `
    ${theme.blocks.showBuyerName ? `
    <div class="info-item">
      <div class="label">Titular</div>
      <div class="value">${model.buyer.name}</div>
    </div>` : ""}
    ${theme.blocks.showTicketType ? `
    <div class="info-item">
      <div class="label">Tipo de Bilhete</div>
      <div class="value">${model.ticketLot.name}</div>
    </div>` : ""}
  `;
}

function footerBlocks(theme: ThemeJson, model: TicketRenderModel) {
  return `
    ${theme.blocks.showOrderId ? `<p style="margin:0">Encomenda: ${model.order.id.substring(0, 8).toUpperCase()}</p>` : ""}
    ${theme.blocks.showSupport && theme.footer.supportEmail ? `<p style="margin:0">Suporte: ${theme.footer.supportEmail}</p>` : ""}
    ${theme.footer.supportUrl ? `<p style="margin:0">${theme.footer.supportUrl}</p>` : ""}
    ${theme.blocks.showTerms ? `<p style="margin:8px 0 0; opacity:0.7">Bilhete pessoal e intransmissível. Apresente o QR Code na entrada.</p>` : ""}
  `;
}

function wrapHtml(title: string, theme: ThemeJson, body: string, extraCss = "") {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=${theme.typography.fontFamily}:wght@400;600;700&display=swap" rel="stylesheet">
  <style>${baseStyles(theme, extraCss)}</style>
</head>
<body>${body}</body>
</html>`;
}

function renderA4Classic(model: TicketRenderModel, theme: ThemeJson): string {
  const qr = qrSizePx(theme.qr.size);
  const accent =
    theme.layout?.accentStyle === "none"
      ? ""
      : theme.layout?.accentStyle === "gradient"
        ? `<div class="accent-gradient">
            ${theme.brand.logoUrl ? `<img src="${theme.brand.logoUrl}" class="logo" alt="" />` : `<strong style="font-size:20px">${model.event.organizationName}</strong>`}
            ${theme.brand.tagline ? `<p style="margin:8px 0 0; opacity:0.9; font-size:14px">${theme.brand.tagline}</p>` : ""}
          </div>`
        : `<div class="accent-bar"></div>`;

  const body = `
    <div class="ticket-container">
      <div class="card">
        ${accent}
        <div class="card-inner">
          <div class="header">
            <div>
              ${theme.layout?.accentStyle === "gradient" ? "" : theme.brand.logoUrl ? `<img src="${theme.brand.logoUrl}" class="logo" alt="" />` : `<h2 style="margin:0;font-size:18px">${model.event.organizationName}</h2>`}
              ${theme.layout?.accentStyle !== "gradient" && theme.brand.tagline ? `<p style="margin:6px 0 0;font-size:13px;color:${theme.colors.muted}">${theme.brand.tagline}</p>` : ""}
            </div>
            <div style="text-align:right">
              <div class="label">Código</div>
              <div class="value" style="font-family:monospace;font-size:17px">${model.ticket.code}</div>
            </div>
          </div>
          <h1 class="event-title">${model.event.title}</h1>
          <div class="info-grid">
            <div class="info-item">
              <div class="label">Local</div>
              <div class="value">${model.event.venue}<br/>${model.event.city}</div>
            </div>
            <div class="info-item">
              <div class="label">Data e Hora</div>
              <div class="value">${formatDate(model.event.startAt)}</div>
            </div>
            ${infoBlocks(theme, model)}
          </div>
          <div class="qr-section">
            <img src="${qrImg(model, qr)}" width="${qr}" height="${qr}" class="qr-code" alt="QR" />
            <div class="qr-label">${theme.qr.label || "Validar na entrada"}</div>
          </div>
          <div class="footer">${footerBlocks(theme, model)}</div>
        </div>
      </div>
    </div>`;

  const radius =
    theme.layout?.cornerRadius === "sm" ? 8 : theme.layout?.cornerRadius === "lg" ? 24 : 16;

  return wrapHtml(model.event.title, theme, body, `
    .ticket-container {
      width: 210mm; min-height: 297mm; padding: 16mm; box-sizing: border-box;
    }
    .card {
      background: ${theme.colors.card};
      border-radius: ${radius}px;
      overflow: hidden;
      box-shadow: ${theme.layout?.cardStyle === "flat" ? "none" : "0 8px 32px rgba(0,0,0,0.08)"};
      border: ${theme.layout?.cardStyle === "bordered" ? `2px solid ${theme.colors.primary}44` : "1px solid rgba(0,0,0,0.06)"};
      min-height: calc(297mm - 32mm);
      display: flex; flex-direction: column;
    }
    .card-inner { padding: 28px 32px; flex: 1; display: flex; flex-direction: column; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; gap: 16px; }
    .event-title { font-size: 30px; font-weight: 700; margin: 0 0 24px; color: ${theme.colors.primary}; line-height: 1.15; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 28px; margin-bottom: 28px; }
    .qr-section { margin-top: auto; padding-top: 28px; border-top: 1px dashed ${theme.colors.muted}55; display: flex; flex-direction: column; align-items: center; }
  `);
}

function renderHorizontalQrRight(model: TicketRenderModel, theme: ThemeJson): string {
  const qr = qrSizePx(theme.qr.size) + 40;
  const body = `
    <div class="ticket-container">
      <div class="card">
        <div class="accent-bar"></div>
        <div class="horizontal-layout">
          <div class="main-col">
            <div class="header-row">
              ${theme.brand.logoUrl ? `<img src="${theme.brand.logoUrl}" class="logo" alt="" />` : `<span class="org-name">${model.event.organizationName}</span>`}
              <span class="ticket-code">${model.ticket.code}</span>
            </div>
            ${theme.brand.tagline ? `<p class="tagline">${theme.brand.tagline}</p>` : ""}
            <h1 class="event-title">${model.event.title}</h1>
            <div class="info-stack">
              <div><div class="label">Local</div><div class="value">${model.event.venue}, ${model.event.city}</div></div>
              <div><div class="label">Data</div><div class="value">${formatDate(model.event.startAt)}</div></div>
              ${infoBlocks(theme, model)}
            </div>
            <div class="footer">${footerBlocks(theme, model)}</div>
          </div>
          <div class="qr-col">
            <img src="${qrImg(model, qr)}" width="${qr}" height="${qr}" class="qr-code" alt="QR" />
            <div class="qr-label">${theme.qr.label || "Validar na entrada"}</div>
          </div>
        </div>
      </div>
    </div>`;

  return wrapHtml(model.event.title, theme, body, `
    .ticket-container { width: 210mm; min-height: 148mm; padding: 12mm; box-sizing: border-box; }
    .card {
      background: ${theme.colors.card}; border-radius: 16px; overflow: hidden;
      border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 6px 24px rgba(0,0,0,0.07);
    }
    .horizontal-layout { display: flex; min-height: 120mm; }
    .main-col { flex: 1; padding: 28px 32px; display: flex; flex-direction: column; }
    .qr-col {
      width: 42%; background: linear-gradient(160deg, ${theme.colors.primary}18, ${theme.colors.bg});
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 24px; border-left: 1px dashed ${theme.colors.muted}44;
    }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .org-name { font-weight: 700; font-size: 16px; }
    .ticket-code { font-family: monospace; font-size: 15px; font-weight: 700; color: ${theme.colors.primary}; }
    .tagline { margin: 0 0 12px; font-size: 13px; color: ${theme.colors.muted}; }
    .event-title { font-size: 26px; font-weight: 700; margin: 0 0 20px; color: ${theme.colors.primary}; }
    .info-stack { display: flex; flex-direction: column; gap: 14px; flex: 1; }
    .footer { margin-top: 20px; }
  `);
}

function renderMobilePass(model: TicketRenderModel, theme: ThemeJson): string {
  const qr = qrSizePx(theme.qr.size);
  const body = `
    <div class="pass-wrap">
      <div class="pass-card">
        <div class="pass-header">
          ${theme.brand.logoUrl ? `<img src="${theme.brand.logoUrl}" class="logo" alt="" />` : `<span class="org">${model.event.organizationName}</span>`}
        </div>
        <div class="pass-body">
          <p class="pass-label">Bilhete Digital</p>
          <h1 class="pass-title">${model.event.title}</h1>
          <div class="pass-meta">
            <div><span class="label">Data</span><span class="value">${formatDate(model.event.startAt)}</span></div>
            <div><span class="label">Local</span><span class="value">${model.event.venue}</span></div>
            ${theme.blocks.showBuyerName ? `<div><span class="label">Titular</span><span class="value">${model.buyer.name}</span></div>` : ""}
            ${theme.blocks.showTicketType ? `<div><span class="label">Tipo</span><span class="value">${model.ticketLot.name}</span></div>` : ""}
          </div>
          <div class="pass-qr">
            <img src="${qrImg(model, qr)}" width="${qr}" height="${qr}" class="qr-code" alt="QR" />
            <div class="qr-label">${theme.qr.label || "Validar na entrada"}</div>
            <div class="pass-code">${model.ticket.code}</div>
          </div>
        </div>
        <div class="pass-footer">${footerBlocks(theme, model)}</div>
      </div>
    </div>`;

  return wrapHtml(model.event.title, theme, body, `
    .pass-wrap {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      padding: 24px; background: ${theme.colors.bg};
    }
    .pass-card {
      width: 360px; max-width: 100%; background: ${theme.colors.card};
      border-radius: 24px; overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.12);
      border: 1px solid rgba(0,0,0,0.06);
    }
    .pass-header {
      background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primary}cc);
      padding: 20px 24px; text-align: center;
    }
    .pass-header .logo { filter: brightness(0) invert(1); max-height: 44px; }
    .pass-header .org { color: #fff; font-weight: 700; font-size: 18px; }
    .pass-body { padding: 24px; text-align: center; }
    .pass-label { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: ${theme.colors.muted}; }
    .pass-title { margin: 8px 0 20px; font-size: 22px; font-weight: 700; color: ${theme.colors.text}; line-height: 1.2; }
    .pass-meta { text-align: left; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .pass-meta .label { display: block; font-size: 10px; }
    .pass-meta .value { display: block; font-size: 14px; font-weight: 600; }
    .pass-qr { padding: 16px 0; border-top: 1px dashed ${theme.colors.muted}44; }
    .pass-code { font-family: monospace; font-size: 16px; font-weight: 700; margin-top: 12px; letter-spacing: 0.05em; color: ${theme.colors.primary}; }
    .pass-footer { padding: 12px 20px 20px; background: ${theme.colors.bg}; }
  `);
}

export function renderTicketHtml(
  preset: TicketTemplatePreset,
  model: TicketRenderModel,
  theme: ThemeJson
): string {
  switch (preset) {
    case "HORIZONTAL_QR_RIGHT":
      return renderHorizontalQrRight(model, theme);
    case "MOBILE_PASS":
      return renderMobilePass(model, theme);
    case "A4_CLASSIC":
    default:
      return renderA4Classic(model, theme);
  }
}
