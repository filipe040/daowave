import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ThemeJson, TicketRenderModel, TicketTemplatePreset } from "../ticket-templates/models";

function formatDateCompact(date: Date) {
  return format(date, "d MMM yyyy · HH:mm", { locale: pt });
}

/** Tamanho de exibição do QR (px) no PDF/email */
export function qrDisplaySizePx(size: ThemeJson["qr"]["size"]): number {
  switch (size) {
    case "L":
      return 160;
    case "M":
      return 128;
    default:
      return 96;
  }
}

function qrSizePx(size: ThemeJson["qr"]["size"]) {
  return qrDisplaySizePx(size);
}

function qrImg(model: TicketRenderModel, size: number) {
  if (model.ticket.qrDataUrl) {
    return model.ticket.qrDataUrl;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(model.ticket.qrPayload)}`;
}

function qrImgHtml(model: TicketRenderModel, size: number) {
  return `<img src="${qrImg(model, size)}" class="qr-code" width="${size}" height="${size}" style="width:${size}px;height:${size}px;max-width:${size}px;max-height:${size}px;" alt="QR" />`;
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
    @page { size: auto; margin: 0; }
    html, body {
      margin: 0;
      padding: 0;
      width: fit-content;
      height: fit-content;
    }
    body {
      font-family: '${theme.typography.fontFamily}', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background: ${theme.colors.bg};
      color: ${theme.colors.text};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .ticket-page {
      page-break-inside: avoid;
      break-inside: avoid;
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
      display: block;
      flex-shrink: 0;
      box-sizing: border-box;
      object-fit: contain;
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
    <div class="ticket-page ticket-container">
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
              <div class="value">${formatDateCompact(model.event.startAt)}</div>
            </div>
            ${infoBlocks(theme, model)}
          </div>
          <div class="qr-section">
            ${qrImgHtml(model, qr)}
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
      box-sizing: border-box;
      width: 190mm;
      padding: 6mm;
      margin: 0;
    }
    .card {
      background: ${theme.colors.card};
      border-radius: ${radius}px;
      overflow: hidden;
      box-shadow: ${theme.layout?.cardStyle === "flat" ? "none" : "0 8px 32px rgba(0,0,0,0.08)"};
      border: ${theme.layout?.cardStyle === "bordered" ? `2px solid ${theme.colors.primary}44` : "1px solid rgba(0,0,0,0.06)"};
      display: flex;
      flex-direction: column;
    }
    .card-inner { padding: 20px 24px 16px; display: flex; flex-direction: column; gap: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; }
    .event-title { font-size: 24px; font-weight: 700; margin: 0 0 16px; color: ${theme.colors.primary}; line-height: 1.2; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; margin-bottom: 12px; }
    .qr-section {
      padding: 16px 0 8px;
      border-top: 1px dashed ${theme.colors.muted}55;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .footer { margin-top: 8px; padding-top: 4px; }
  `);
}

function renderHorizontalQrRight(model: TicketRenderModel, theme: ThemeJson): string {
  const qr = qrSizePx(theme.qr.size);
  const body = `
    <div class="ticket-page ticket-container">
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
              <div><div class="label">Data</div><div class="value">${formatDateCompact(model.event.startAt)}</div></div>
              ${infoBlocks(theme, model)}
            </div>
            <div class="footer">${footerBlocks(theme, model)}</div>
          </div>
          <div class="qr-col">
            ${qrImgHtml(model, qr)}
            <div class="qr-label">${theme.qr.label || "Validar na entrada"}</div>
          </div>
        </div>
      </div>
    </div>`;

  return wrapHtml(model.event.title, theme, body, `
    .ticket-container { box-sizing: border-box; width: 190mm; padding: 5mm; margin: 0; }
    .card {
      background: ${theme.colors.card}; border-radius: 16px; overflow: hidden;
      border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 6px 24px rgba(0,0,0,0.07);
    }
    .horizontal-layout { display: flex; align-items: stretch; }
    .main-col { flex: 1; padding: 20px 24px; display: flex; flex-direction: column; min-width: 0; }
    .qr-col {
      flex-shrink: 0;
      width: auto;
      background: linear-gradient(160deg, ${theme.colors.primary}18, ${theme.colors.bg});
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 20px 16px; border-left: 1px dashed ${theme.colors.muted}44;
    }
    .qr-col .qr-code { padding: 10px; }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
    .org-name { font-weight: 700; font-size: 16px; }
    .ticket-code { font-family: monospace; font-size: 14px; font-weight: 700; color: ${theme.colors.primary}; flex-shrink: 0; }
    .tagline { margin: 0 0 10px; font-size: 13px; color: ${theme.colors.muted}; }
    .event-title { font-size: 22px; font-weight: 700; margin: 0 0 14px; color: ${theme.colors.primary}; line-height: 1.2; }
    .info-stack { display: flex; flex-direction: column; gap: 10px; flex: 1; }
    .footer { margin-top: 12px; }
  `);
}

function renderMobilePass(model: TicketRenderModel, theme: ThemeJson): string {
  const qr = qrSizePx(theme.qr.size);
  const body = `
    <div class="ticket-page pass-wrap">
      <div class="pass-card">
        <div class="pass-header">
          ${theme.brand.logoUrl ? `<img src="${theme.brand.logoUrl}" class="logo" alt="" />` : `<span class="org">${model.event.organizationName}</span>`}
        </div>
        <div class="pass-body">
          <p class="pass-label">Bilhete Digital</p>
          <h1 class="pass-title">${model.event.title}</h1>
          <div class="pass-meta">
            <div><span class="label">Data</span><span class="value">${formatDateCompact(model.event.startAt)}</span></div>
            <div><span class="label">Local</span><span class="value">${model.event.venue}</span></div>
            ${theme.blocks.showBuyerName ? `<div><span class="label">Titular</span><span class="value">${model.buyer.name}</span></div>` : ""}
            ${theme.blocks.showTicketType ? `<div><span class="label">Tipo</span><span class="value">${model.ticketLot.name}</span></div>` : ""}
          </div>
          <div class="pass-qr">
            ${qrImgHtml(model, qr)}
            <div class="qr-label">${theme.qr.label || "Validar na entrada"}</div>
            <div class="pass-code">${model.ticket.code}</div>
          </div>
        </div>
        <div class="pass-footer">${footerBlocks(theme, model)}</div>
      </div>
    </div>`;

  return wrapHtml(model.event.title, theme, body, `
    .pass-wrap {
      box-sizing: border-box;
      width: fit-content;
      padding: 5mm;
      margin: 0;
      background: ${theme.colors.bg};
    }
    .pass-card {
      width: 400px;
      max-width: 100%;
      background: ${theme.colors.card};
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,0.12);
      border: 1px solid rgba(0,0,0,0.06);
    }
    .pass-header {
      background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primary}cc);
      padding: 16px 20px; text-align: center;
    }
    .pass-header .logo { filter: brightness(0) invert(1); max-height: 44px; }
    .pass-header .org { color: #fff; font-weight: 700; font-size: 18px; }
    .pass-body { padding: 20px; text-align: center; }
    .pass-label { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: ${theme.colors.muted}; }
    .pass-title { margin: 8px 0 16px; font-size: 20px; font-weight: 700; color: ${theme.colors.text}; line-height: 1.2; }
    .pass-meta { text-align: left; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .pass-meta .label { display: block; font-size: 10px; }
    .pass-meta .value { display: block; font-size: 14px; font-weight: 600; }
    .pass-qr { padding: 12px 0; border-top: 1px dashed ${theme.colors.muted}44; }
    .pass-code { font-family: monospace; font-size: 16px; font-weight: 700; margin-top: 10px; letter-spacing: 0.05em; color: ${theme.colors.primary}; }
    .pass-footer { padding: 10px 16px 16px; background: ${theme.colors.bg}; }
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
