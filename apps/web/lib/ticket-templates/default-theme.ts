import { ThemeJson } from "./models";

export const DEFAULT_TICKET_THEME: ThemeJson = {
  brand: {
    logoUrl: "",
    tagline: "",
    logoSize: "md",
    logoPosition: "left",
    headerStyle: "standard",
    watermarkText: "",
    backgroundUrl: "",
  },
  colors: {
    bg: "#ffffff",
    card: "#ffffff",
    text: "#111111",
    primary: "#19c37d",
    muted: "#666666",
    accent: "#19c37d",
    qrBackground: "#ffffff",
  },
  typography: {
    fontFamily: "Inter",
    titleSize: "md",
    bodySize: "md",
    titleWeight: "bold",
    uppercaseLabels: true,
  },
  qr: {
    size: "M",
    label: "Validar na entrada",
    background: "#ffffff",
    borderRadius: "md",
    frameStyle: "light",
  },
  blocks: {
    showBuyerName: true,
    showOrderId: true,
    showTicketType: true,
    showTerms: true,
    showSupport: true,
    showEventTitle: true,
    showVenue: true,
    showCity: true,
    showDate: true,
    showTicketCode: true,
    showOrganization: true,
    customTerms: "",
    badgeText: "Bilhete Digital",
  },
  footer: {
    supportUrl: "",
    supportEmail: "",
  },
  layout: {
    accentStyle: "bar",
    cardStyle: "elevated",
    cornerRadius: "md",
    pagePadding: "md",
    pageWidth: "standard",
    contentAlign: "left",
    dividerStyle: "dashed",
    backgroundPattern: "none",
  },
  copy: {
    labelBuyer: "Titular",
    labelVenue: "Local",
    labelDate: "Data e Hora",
    labelTicketType: "Tipo de Bilhete",
    labelTicketCode: "Código",
    labelBadge: "Bilhete Digital",
  },
};

/** Preenche campos em falta (templates antigos) sem rejeitar dados válidos */
export function normalizeTicketTheme(raw?: Partial<ThemeJson> | null): ThemeJson {
  return {
    brand: { ...DEFAULT_TICKET_THEME.brand, ...(raw?.brand || {}) },
    colors: { ...DEFAULT_TICKET_THEME.colors, ...(raw?.colors || {}) },
    typography: { ...DEFAULT_TICKET_THEME.typography, ...(raw?.typography || {}) },
    qr: { ...DEFAULT_TICKET_THEME.qr, ...(raw?.qr || {}) },
    blocks: { ...DEFAULT_TICKET_THEME.blocks, ...(raw?.blocks || {}) },
    footer: { ...DEFAULT_TICKET_THEME.footer, ...(raw?.footer || {}) },
    layout: { ...DEFAULT_TICKET_THEME.layout, ...(raw?.layout || {}) },
    copy: { ...DEFAULT_TICKET_THEME.copy, ...(raw?.copy || {}) },
  };
}

export function mergeTicketTheme(theme?: ThemeJson): ThemeJson {
  const merged = normalizeTicketTheme(theme);

  if (merged.brand.logoUrl?.startsWith("/")) {
    const baseUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    merged.brand.logoUrl = `${baseUrl}${merged.brand.logoUrl}`;
  }

  if (merged.brand.backgroundUrl?.startsWith("/")) {
    const baseUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    merged.brand.backgroundUrl = `${baseUrl}${merged.brand.backgroundUrl}`;
  }

  if (!merged.colors.accent) {
    merged.colors.accent = merged.colors.primary;
  }

  return merged;
}
