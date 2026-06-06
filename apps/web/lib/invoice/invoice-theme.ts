import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Cor inválida (use #hex)");

export const invoiceThemeSchema = z.object({
  brandName: z.string().max(80).optional(),
  tagline: z.string().max(120).optional(),
  logoUrl: z.string().max(2048).optional(),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  backgroundColor: hexColor.optional(),
  textColor: hexColor.optional(),
  mutedColor: hexColor.optional(),
  footerText: z.string().max(200).optional(),
  websiteUrl: z.string().max(2048).optional(),
  showPlatformCredit: z.boolean().optional(),
});

export type InvoiceThemeJson = z.infer<typeof invoiceThemeSchema>;

export type ResolvedInvoiceTheme = {
  brandName: string;
  tagline: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  mutedColor: string;
  footerText: string;
  websiteUrl: string | null;
  showPlatformCredit: boolean;
};

export const DEFAULT_INVOICE_THEME: ResolvedInvoiceTheme = {
  brandName: "GoPass",
  tagline: "Bilhética Digital",
  logoUrl: null,
  primaryColor: "#6C2BD9",
  secondaryColor: "#D946EF",
  backgroundColor: "#FFFFFF",
  textColor: "#18181B",
  mutedColor: "#71717A",
  footerText: "",
  websiteUrl: null,
  showPlatformCredit: true,
};

function parseThemeJson(raw: unknown): InvoiceThemeJson | null {
  if (raw == null) return null;
  const parsed = invoiceThemeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function mergeTheme(
  base: ResolvedInvoiceTheme,
  partial: InvoiceThemeJson | null
): ResolvedInvoiceTheme {
  if (!partial) return base;
  return {
    brandName: partial.brandName?.trim() || base.brandName,
    tagline: partial.tagline?.trim() || base.tagline,
    logoUrl: partial.logoUrl?.trim() || base.logoUrl,
    primaryColor: partial.primaryColor || base.primaryColor,
    secondaryColor: partial.secondaryColor || base.secondaryColor,
    backgroundColor: partial.backgroundColor || base.backgroundColor,
    textColor: partial.textColor || base.textColor,
    mutedColor: partial.mutedColor || base.mutedColor,
    footerText: partial.footerText?.trim() ?? base.footerText,
    websiteUrl: partial.websiteUrl?.trim() || base.websiteUrl,
    showPlatformCredit:
      partial.showPlatformCredit !== undefined
        ? partial.showPlatformCredit
        : base.showPlatformCredit,
  };
}

function absolutizeUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    const base =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://tickets.daowave.pt";
    return `${base.replace(/\/$/, "")}${url}`;
  }
  return url;
}

export function resolveInvoiceTheme(params: {
  organization?: {
    name?: string | null;
    logoUrl?: string | null;
    website?: string | null;
    invoiceThemeJson?: unknown;
  } | null;
  event?: {
    title?: string | null;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    invoiceThemeJson?: unknown;
  } | null;
}): ResolvedInvoiceTheme {
  const org = params.organization;
  const event = params.event;

  let theme: ResolvedInvoiceTheme = {
    ...DEFAULT_INVOICE_THEME,
    brandName: org?.name?.trim() || DEFAULT_INVOICE_THEME.brandName,
    logoUrl: org?.logoUrl?.trim() || null,
    websiteUrl: org?.website?.trim() || null,
  };

  theme = mergeTheme(theme, parseThemeJson(org?.invoiceThemeJson));

  if (event) {
    const eventDefaults: InvoiceThemeJson = {};
    if (event.primaryColor) eventDefaults.primaryColor = event.primaryColor;
    if (event.secondaryColor) eventDefaults.secondaryColor = event.secondaryColor;
    if (event.logoUrl) eventDefaults.logoUrl = event.logoUrl;
    theme = mergeTheme(theme, eventDefaults);
    theme = mergeTheme(theme, parseThemeJson(event.invoiceThemeJson));
  }

  return {
    ...theme,
    logoUrl: absolutizeUrl(theme.logoUrl),
    websiteUrl: theme.websiteUrl ? absolutizeUrl(theme.websiteUrl) : null,
  };
}

export function normalizeInvoiceThemeInput(raw: unknown): InvoiceThemeJson {
  if (raw == null || typeof raw !== "object") return {};
  const parsed = invoiceThemeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Tema de fatura inválido");
  }
  return parsed.data;
}
