import { ThemeJson } from "./models";

const FONT_LINKS: Record<string, string> = {
  Inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap",
  Roboto: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap",
  Poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap",
  Montserrat: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap",
  "Open Sans": "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap",
  Lato: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap",
  "Playfair Display": "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap",
  Oswald: "https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap",
};

export function fontStylesheetLink(theme: ThemeJson): string {
  const href = FONT_LINKS[theme.typography.fontFamily];
  return href ? `<link rel="stylesheet" href="${href}" />` : "";
}

export function accentColor(theme: ThemeJson): string {
  return theme.colors.accent || theme.colors.primary;
}

export function cornerRadiusPx(theme: ThemeJson): number {
  switch (theme.layout?.cornerRadius) {
    case "sm":
      return 8;
    case "lg":
      return 24;
    default:
      return 16;
  }
}

export function pageWidthMm(theme: ThemeJson): string {
  switch (theme.layout?.pageWidth) {
    case "compact":
      return "160mm";
    case "wide":
      return "210mm";
    default:
      return "190mm";
  }
}

export function pagePaddingMm(theme: ThemeJson): string {
  switch (theme.layout?.pagePadding) {
    case "none":
      return "0";
    case "sm":
      return "4mm";
    case "lg":
      return "10mm";
    default:
      return "6mm";
  }
}

export function titleFontSizePx(theme: ThemeJson): number {
  switch (theme.typography.titleSize) {
    case "sm":
      return 20;
    case "lg":
      return 28;
    case "xl":
      return 32;
    default:
      return 24;
  }
}

export function bodyFontSizePx(theme: ThemeJson): number {
  switch (theme.typography.bodySize) {
    case "sm":
      return 13;
    case "lg":
      return 17;
    default:
      return 15;
  }
}

export function titleFontWeight(theme: ThemeJson): number {
  switch (theme.typography.titleWeight) {
    case "semibold":
      return 600;
    case "extrabold":
      return 800;
    default:
      return 700;
  }
}

export function logoMaxHeightPx(theme: ThemeJson): number {
  switch (theme.brand.logoSize) {
    case "sm":
      return 40;
    case "lg":
      return 72;
    default:
      return 56;
  }
}

export function qrBorderRadiusPx(theme: ThemeJson): number {
  switch (theme.qr.borderRadius) {
    case "none":
      return 0;
    case "sm":
      return 8;
    case "lg":
      return 20;
    default:
      return 12;
  }
}

export function dividerBorder(theme: ThemeJson): string {
  const color = `${theme.colors.muted}55`;
  switch (theme.layout?.dividerStyle) {
    case "solid":
      return `1px solid ${color}`;
    case "dotted":
      return `1px dotted ${color}`;
    case "none":
      return "none";
    default:
      return `1px dashed ${color}`;
  }
}

export function cardBoxShadow(theme: ThemeJson): string {
  if (theme.layout?.cardStyle === "flat" || theme.layout?.cardStyle === "bordered") {
    return "none";
  }
  return "0 8px 32px rgba(0,0,0,0.08)";
}

export function cardBorder(theme: ThemeJson): string {
  if (theme.layout?.cardStyle === "bordered") {
    return `2px solid ${accentColor(theme)}44`;
  }
  return "1px solid rgba(0,0,0,0.06)";
}

export function qrFrameStyle(theme: ThemeJson): string {
  const bg = theme.qr.background || theme.colors.qrBackground || "#ffffff";
  const radius = qrBorderRadiusPx(theme);
  switch (theme.qr.frameStyle) {
    case "none":
      return `background:${bg};border-radius:${radius}px;padding:0;box-shadow:none;`;
    case "accent":
      return `background:${bg};border-radius:${radius}px;padding:12px;box-shadow:0 0 0 2px ${accentColor(theme)};`;
    case "bold":
      return `background:${bg};border-radius:${radius}px;padding:14px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:2px solid ${accentColor(theme)}33;`;
    default:
      return `background:${bg};border-radius:${radius}px;padding:10px;box-shadow:0 2px 12px rgba(0,0,0,0.08);`;
  }
}

export function backgroundPatternCss(theme: ThemeJson): string {
  const c = `${theme.colors.muted}18`;
  switch (theme.layout?.backgroundPattern) {
    case "dots":
      return `background-image: radial-gradient(${c} 1px, transparent 1px); background-size: 14px 14px;`;
    case "grid":
      return `background-image: linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px); background-size: 18px 18px;`;
    case "diagonal":
      return `background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, ${c} 8px, ${c} 9px);`;
    default:
      return "";
  }
}

export function labelText(
  theme: ThemeJson,
  key: keyof NonNullable<ThemeJson["copy"]>,
  fallback: string
): string {
  return theme.copy?.[key] || fallback;
}

export function termsText(theme: ThemeJson): string {
  const custom = theme.blocks.customTerms?.trim();
  if (custom) return custom;
  return "Bilhete pessoal e intransmissível. Apresente o QR Code na entrada.";
}

export function headerAlign(theme: ThemeJson): string {
  return theme.brand.logoPosition === "center"
    ? "center"
    : theme.brand.logoPosition === "right"
      ? "flex-end"
      : "flex-start";
}

export function contentTextAlign(theme: ThemeJson): string {
  return theme.layout?.contentAlign === "center" ? "center" : "left";
}

export function accentBlock(theme: ThemeJson, model: { organizationName: string; logoUrl?: string; tagline?: string }) {
  const style = theme.layout?.accentStyle ?? "bar";
  const radius = cornerRadiusPx(theme);
  const color = accentColor(theme);

  if (style === "none") return "";

  if (style === "gradient") {
    const align = headerAlign(theme);
    return `<div class="accent-gradient" style="text-align:${align === "center" ? "center" : "left"}">
      ${model.logoUrl ? `<img src="${model.logoUrl}" class="logo" alt="" />` : `<strong style="font-size:20px">${model.organizationName}</strong>`}
      ${model.tagline ? `<p style="margin:8px 0 0; opacity:0.9; font-size:14px">${model.tagline}</p>` : ""}
    </div>`;
  }

  return `<div class="accent-bar" style="background:${color};border-radius:${radius}px ${radius}px 0 0;"></div>`;
}

export function cardBackgroundStyle(theme: ThemeJson): string {
  if (theme.brand.backgroundUrl) {
    return `background-image: linear-gradient(${theme.colors.card}ee, ${theme.colors.card}ee), url('${theme.brand.backgroundUrl}'); background-size: cover; background-position: center;`;
  }
  return `background: ${theme.colors.card};`;
}

export function watermarkHtml(theme: ThemeJson): string {
  const text = theme.brand.watermarkText?.trim();
  if (!text) return "";
  return `<div class="watermark" aria-hidden="true">${text}</div>`;
}
