import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ThemeJson, TicketRenderModel, TicketTemplatePreset } from "../ticket-templates/models";
import {
  accentBlock,
  accentColor,
  backgroundPatternCss,
  bodyFontSizePx,
  cardBackgroundStyle,
  cardBorder,
  cardBoxShadow,
  contentTextAlign,
  cornerRadiusPx,
  dividerBorder,
  fontStylesheetLink,
  headerAlign,
  labelText,
  logoMaxHeightPx,
  pagePaddingMm,
  pageWidthMm,
  qrFrameStyle,
  termsText,
  titleFontSizePx,
  titleFontWeight,
  watermarkHtml,
} from "../ticket-templates/theme-helpers";

function formatDateCompact(date: Date) {
  return format(date, "d MMM yyyy · HH:mm", { locale: pt });
}

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

function qrImg(model: TicketRenderModel, size: number) {
  if (model.ticket.qrDataUrl) {
    return model.ticket.qrDataUrl;
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(model.ticket.qrPayload)}`;
}

function qrImgHtml(model: TicketRenderModel, theme: ThemeJson) {
  const size = qrDisplaySizePx(theme.qr.size);
  const frame = qrFrameStyle(theme);
  return `<img src="${qrImg(model, size)}" class="qr-code" width="${size}" height="${size}" style="width:${size}px;height:${size}px;max-width:${size}px;max-height:${size}px;${frame}" alt="QR" />`;
}

function labelClass(theme: ThemeJson) {
  return theme.typography.uppercaseLabels === false ? "label label-normal" : "label";
}

function baseStyles(theme: ThemeJson, extra = "") {
  const radius = cornerRadiusPx(theme);
  const bodySize = bodyFontSizePx(theme);
  const logoH = logoMaxHeightPx(theme);
  const align = contentTextAlign(theme);
  const pattern = backgroundPatternCss(theme);

  return `
    @page { size: auto; margin: 0; }
    html, body { margin: 0; padding: 0; width: fit-content; height: fit-content; }
    body {
      font-family: '${theme.typography.fontFamily}', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      margin: 0; padding: 0;
      background: ${theme.colors.bg};
      color: ${theme.colors.text};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      ${pattern}
    }
    .ticket-page { page-break-inside: avoid; break-inside: avoid; position: relative; }
    .watermark {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 48px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;
      color: ${theme.colors.muted}12; pointer-events: none; user-select: none; transform: rotate(-24deg);
      z-index: 0;
    }
    .card-content { position: relative; z-index: 1; }
    .accent-bar { height: 6px; background: ${accentColor(theme)}; border-radius: ${radius}px ${radius}px 0 0; }
    .accent-gradient {
      background: linear-gradient(135deg, ${accentColor(theme)} 0%, ${theme.colors.muted}88 100%);
      padding: 24px 30px; color: #fff;
    }
    .label {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
      color: ${theme.colors.muted}; margin-bottom: 4px;
    }
    .label-normal { text-transform: none; letter-spacing: normal; font-size: 12px; }
    .value { font-size: ${bodySize}px; font-weight: 600; line-height: 1.35; }
    .logo { max-height: ${logoH}px; max-width: 200px; object-fit: contain; }
    .qr-code {
      display: block; flex-shrink: 0; box-sizing: border-box; object-fit: contain;
    }
    .qr-label { font-size: 13px; color: ${theme.colors.muted}; margin-top: 10px; text-align: center; }
    .footer { font-size: 11px; color: ${theme.colors.muted}; text-align: ${align}; line-height: 1.6; }
    .badge {
      display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 0.12em;
      text-transform: uppercase; color: ${accentColor(theme)};
      background: ${accentColor(theme)}18; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px;
    }
    ${extra}
  `;
}

function venueLine(model: TicketRenderModel, theme: ThemeJson): string {
  const parts: string[] = [];
  if (theme.blocks.showVenue !== false) parts.push(model.event.venue);
  if (theme.blocks.showCity !== false && model.event.city) parts.push(model.event.city);
  return parts.join(theme.blocks.showVenue !== false && theme.blocks.showCity !== false ? ", " : "");
}

function infoBlocks(theme: ThemeJson, model: TicketRenderModel) {
  return `
    ${theme.blocks.showBuyerName ? `
    <div class="info-item">
      <div class="${labelClass(theme)}">${labelText(theme, "labelBuyer", "Titular")}</div>
      <div class="value">${model.buyer.name}</div>
    </div>` : ""}
    ${theme.blocks.showTicketType ? `
    <div class="info-item">
      <div class="${labelClass(theme)}">${labelText(theme, "labelTicketType", "Tipo de Bilhete")}</div>
      <div class="value">${model.ticketLot.name}</div>
    </div>` : ""}
  `;
}

function footerBlocks(theme: ThemeJson, model: TicketRenderModel) {
  return `
    ${theme.blocks.showOrderId ? `<p style="margin:0">Encomenda: ${model.order.id.substring(0, 8).toUpperCase()}</p>` : ""}
    ${theme.blocks.showSupport && theme.footer.supportEmail ? `<p style="margin:0">Suporte: ${theme.footer.supportEmail}</p>` : ""}
    ${theme.footer.supportUrl ? `<p style="margin:0">${theme.footer.supportUrl}</p>` : ""}
    ${theme.blocks.showTerms ? `<p style="margin:8px 0 0; opacity:0.7">${termsText(theme)}</p>` : ""}
  `;
}

function brandHeader(theme: ThemeJson, model: TicketRenderModel, inGradient: boolean) {
  if (inGradient || theme.blocks.showOrganization === false) return "";
  const align = headerAlign(theme);
  const minimal = theme.brand.headerStyle === "minimal";
  const bold = theme.brand.headerStyle === "bold";

  if (theme.brand.logoUrl) {
    return `<div style="display:flex;justify-content:${align};margin-bottom:${minimal ? 8 : 12}px">
      <img src="${theme.brand.logoUrl}" class="logo" alt="" />
    </div>`;
  }

  return `<div style="text-align:${align === "center" ? "center" : "left"};margin-bottom:12px">
    <h2 style="margin:0;font-size:${bold ? 22 : 18}px;font-weight:${bold ? 800 : 700}">${model.event.organizationName}</h2>
    ${!minimal && theme.brand.tagline ? `<p style="margin:6px 0 0;font-size:13px;color:${theme.colors.muted}">${theme.brand.tagline}</p>` : ""}
  </div>`;
}

function ticketCodeBlock(theme: ThemeJson, model: TicketRenderModel) {
  if (theme.blocks.showTicketCode === false) return "";
  return `
    <div style="text-align:right">
      <div class="${labelClass(theme)}">${labelText(theme, "labelTicketCode", "Código")}</div>
      <div class="value" style="font-family:monospace;font-size:17px">${model.ticket.code}</div>
    </div>`;
}

function wrapHtml(title: string, theme: ThemeJson, body: string, extraCss = "") {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  ${fontStylesheetLink(theme)}
  <style>${baseStyles(theme, extraCss)}</style>
</head>
<body>${body}</body>
</html>`;
}

function sharedCardCss(theme: ThemeJson) {
  const radius = cornerRadiusPx(theme);
  return `
    .card {
      ${cardBackgroundStyle(theme)}
      border-radius: ${radius}px;
      overflow: hidden;
      box-shadow: ${cardBoxShadow(theme)};
      border: ${cardBorder(theme)};
      display: flex;
      flex-direction: column;
    }
  `;
}

function renderA4Classic(model: TicketRenderModel, theme: ThemeJson): string {
  const inGradient = theme.layout?.accentStyle === "gradient";
  const titleSize = titleFontSizePx(theme);
  const titleWeight = titleFontWeight(theme);
  const align = contentTextAlign(theme);
  const venue = venueLine(model, theme);
  const badge = theme.blocks.badgeText?.trim() || labelText(theme, "labelBadge", "Bilhete Digital");

  const accent = accentBlock(theme, {
    organizationName: model.event.organizationName,
    logoUrl: theme.brand.logoUrl,
    tagline: theme.brand.tagline,
  });

  const body = `
    <div class="ticket-page ticket-container">
      ${watermarkHtml(theme)}
      <div class="card card-content">
        ${accent}
        <div class="card-inner">
          <div class="header">
            <div style="flex:1">
              ${inGradient ? "" : brandHeader(theme, model, false)}
            </div>
            ${ticketCodeBlock(theme, model)}
          </div>
          ${badge ? `<div style="text-align:${align}"><span class="badge">${badge}</span></div>` : ""}
          ${theme.blocks.showEventTitle !== false ? `<h1 class="event-title">${model.event.title}</h1>` : ""}
          <div class="info-grid">
            ${venue ? `
            <div class="info-item">
              <div class="${labelClass(theme)}">${labelText(theme, "labelVenue", "Local")}</div>
              <div class="value">${venue}</div>
            </div>` : ""}
            ${theme.blocks.showDate !== false ? `
            <div class="info-item">
              <div class="${labelClass(theme)}">${labelText(theme, "labelDate", "Data e Hora")}</div>
              <div class="value">${formatDateCompact(model.event.startAt)}</div>
            </div>` : ""}
            ${infoBlocks(theme, model)}
          </div>
          <div class="qr-section">
            ${qrImgHtml(model, theme)}
            <div class="qr-label">${theme.qr.label || "Validar na entrada"}</div>
          </div>
          <div class="footer">${footerBlocks(theme, model)}</div>
        </div>
      </div>
    </div>`;

  return wrapHtml(model.event.title, theme, body, `
    .ticket-container {
      box-sizing: border-box;
      width: ${pageWidthMm(theme)};
      padding: ${pagePaddingMm(theme)};
      margin: 0;
    }
    ${sharedCardCss(theme)}
    .card-inner { padding: 20px 24px 16px; display: flex; flex-direction: column; text-align: ${align}; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 16px; }
    .event-title {
      font-size: ${titleSize}px; font-weight: ${titleWeight}; margin: 0 0 16px;
      color: ${accentColor(theme)}; line-height: 1.2; text-align: ${align};
    }
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; margin-bottom: 12px;
      text-align: ${align};
    }
    .qr-section {
      padding: 16px 0 8px;
      border-top: ${dividerBorder(theme)};
      display: flex; flex-direction: column; align-items: center;
    }
    .footer { margin-top: 8px; padding-top: 4px; }
  `);
}

function renderHorizontalQrRight(model: TicketRenderModel, theme: ThemeJson): string {
  const titleSize = titleFontSizePx(theme);
  const titleWeight = titleFontWeight(theme);
  const radius = cornerRadiusPx(theme);
  const venue = venueLine(model, theme);
  const accent = accentBlock(theme, {
    organizationName: model.event.organizationName,
    logoUrl: theme.brand.logoUrl,
    tagline: theme.brand.tagline,
  });

  const body = `
    <div class="ticket-page ticket-container">
      ${watermarkHtml(theme)}
      <div class="card card-content">
        ${accent || `<div class="accent-bar"></div>`}
        <div class="horizontal-layout">
          <div class="main-col">
            <div class="header-row">
              ${theme.blocks.showOrganization !== false && theme.brand.logoUrl
                ? `<img src="${theme.brand.logoUrl}" class="logo" alt="" />`
                : theme.blocks.showOrganization !== false
                  ? `<span class="org-name">${model.event.organizationName}</span>`
                  : ""}
              ${theme.blocks.showTicketCode !== false ? `<span class="ticket-code">${model.ticket.code}</span>` : ""}
            </div>
            ${theme.brand.tagline && theme.brand.headerStyle !== "minimal" ? `<p class="tagline">${theme.brand.tagline}</p>` : ""}
            ${theme.blocks.showEventTitle !== false ? `<h1 class="event-title">${model.event.title}</h1>` : ""}
            <div class="info-stack">
              ${venue ? `<div><div class="${labelClass(theme)}">${labelText(theme, "labelVenue", "Local")}</div><div class="value">${venue}</div></div>` : ""}
              ${theme.blocks.showDate !== false ? `<div><div class="${labelClass(theme)}">${labelText(theme, "labelDate", "Data")}</div><div class="value">${formatDateCompact(model.event.startAt)}</div></div>` : ""}
              ${infoBlocks(theme, model)}
            </div>
            <div class="footer">${footerBlocks(theme, model)}</div>
          </div>
          <div class="qr-col">
            ${qrImgHtml(model, theme)}
            <div class="qr-label">${theme.qr.label || "Validar na entrada"}</div>
          </div>
        </div>
      </div>
    </div>`;

  return wrapHtml(model.event.title, theme, body, `
    .ticket-container { box-sizing: border-box; width: ${pageWidthMm(theme)}; padding: ${pagePaddingMm(theme)}; margin: 0; }
    .card {
      ${cardBackgroundStyle(theme)}
      border-radius: ${radius}px; overflow: hidden;
      border: ${cardBorder(theme)}; box-shadow: ${cardBoxShadow(theme)};
    }
    .horizontal-layout { display: flex; align-items: stretch; }
    .main-col { flex: 1; padding: 20px 24px; display: flex; flex-direction: column; min-width: 0; text-align: ${contentTextAlign(theme)}; }
    .qr-col {
      flex-shrink: 0; width: auto;
      background: linear-gradient(160deg, ${accentColor(theme)}18, ${theme.colors.bg});
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 20px 16px; border-left: ${dividerBorder(theme)};
    }
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
    .org-name { font-weight: 700; font-size: 16px; }
    .ticket-code { font-family: monospace; font-size: 14px; font-weight: 700; color: ${accentColor(theme)}; flex-shrink: 0; }
    .tagline { margin: 0 0 10px; font-size: 13px; color: ${theme.colors.muted}; }
    .event-title { font-size: ${titleSize}px; font-weight: ${titleWeight}; margin: 0 0 14px; color: ${accentColor(theme)}; line-height: 1.2; }
    .info-stack { display: flex; flex-direction: column; gap: 10px; flex: 1; }
    .footer { margin-top: 12px; }
  `);
}

function renderMobilePass(model: TicketRenderModel, theme: ThemeJson): string {
  const titleSize = titleFontSizePx(theme) - 2;
  const titleWeight = titleFontWeight(theme);
  const radius = cornerRadiusPx(theme);
  const venue = venueLine(model, theme);
  const badge = theme.blocks.badgeText?.trim() || labelText(theme, "labelBadge", "Bilhete Digital");

  const body = `
    <div class="ticket-page pass-wrap">
      ${watermarkHtml(theme)}
      <div class="pass-card card-content">
        <div class="pass-header">
          ${theme.blocks.showOrganization !== false && theme.brand.logoUrl
            ? `<img src="${theme.brand.logoUrl}" class="logo" alt="" />`
            : theme.blocks.showOrganization !== false
              ? `<span class="org">${model.event.organizationName}</span>`
              : ""}
        </div>
        <div class="pass-body">
          ${badge ? `<p class="pass-label">${badge}</p>` : ""}
          ${theme.blocks.showEventTitle !== false ? `<h1 class="pass-title">${model.event.title}</h1>` : ""}
          <div class="pass-meta">
            ${theme.blocks.showDate !== false ? `<div><span class="${labelClass(theme)}">${labelText(theme, "labelDate", "Data")}</span><span class="value">${formatDateCompact(model.event.startAt)}</span></div>` : ""}
            ${venue ? `<div><span class="${labelClass(theme)}">${labelText(theme, "labelVenue", "Local")}</span><span class="value">${venue}</span></div>` : ""}
            ${theme.blocks.showBuyerName ? `<div><span class="${labelClass(theme)}">${labelText(theme, "labelBuyer", "Titular")}</span><span class="value">${model.buyer.name}</span></div>` : ""}
            ${theme.blocks.showTicketType ? `<div><span class="${labelClass(theme)}">${labelText(theme, "labelTicketType", "Tipo")}</span><span class="value">${model.ticketLot.name}</span></div>` : ""}
          </div>
          <div class="pass-qr">
            ${qrImgHtml(model, theme)}
            <div class="qr-label">${theme.qr.label || "Validar na entrada"}</div>
            ${theme.blocks.showTicketCode !== false ? `<div class="pass-code">${model.ticket.code}</div>` : ""}
          </div>
        </div>
        <div class="pass-footer">${footerBlocks(theme, model)}</div>
      </div>
    </div>`;

  return wrapHtml(model.event.title, theme, body, `
    .pass-wrap {
      box-sizing: border-box; width: fit-content; padding: ${pagePaddingMm(theme)};
      margin: 0; background: ${theme.colors.bg}; ${backgroundPatternCss(theme)}
    }
    .pass-card {
      width: ${theme.layout?.pageWidth === "wide" ? 440 : theme.layout?.pageWidth === "compact" ? 340 : 400}px;
      max-width: 100%;
      ${cardBackgroundStyle(theme)}
      border-radius: ${radius}px;
      overflow: hidden;
      box-shadow: ${theme.layout?.cardStyle === "flat" ? "none" : "0 20px 50px rgba(0,0,0,0.12)"};
      border: ${cardBorder(theme)};
      position: relative;
    }
    .pass-header {
      background: linear-gradient(135deg, ${accentColor(theme)}, ${accentColor(theme)}cc);
      padding: 16px 20px; text-align: ${theme.brand.logoPosition === "left" ? "left" : theme.brand.logoPosition === "right" ? "right" : "center"};
    }
    .pass-header .logo { filter: brightness(0) invert(1); max-height: ${logoMaxHeightPx(theme) - 12}px; }
    .pass-header .org { color: #fff; font-weight: 700; font-size: 18px; }
    .pass-body { padding: 20px; text-align: ${contentTextAlign(theme)}; }
    .pass-label { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: ${theme.colors.muted}; }
    .pass-title { margin: 8px 0 16px; font-size: ${titleSize}px; font-weight: ${titleWeight}; color: ${theme.colors.text}; line-height: 1.2; }
    .pass-meta { text-align: ${contentTextAlign(theme)}; display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .pass-meta .label { display: block; font-size: 10px; }
    .pass-meta .value { display: block; font-size: ${bodyFontSizePx(theme) - 1}px; font-weight: 600; }
    .pass-qr { padding: 12px 0; border-top: ${dividerBorder(theme)}; display: flex; flex-direction: column; align-items: center; }
    .pass-code { font-family: monospace; font-size: 16px; font-weight: 700; margin-top: 10px; letter-spacing: 0.05em; color: ${accentColor(theme)}; }
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
