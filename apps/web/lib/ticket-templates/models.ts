import { z } from "zod";

/**
 * Fontes disponíveis no editor de bilhetes
 */
export const WHITELISTED_FONTS = [
    "Inter",
    "Roboto",
    "Poppins",
    "Montserrat",
    "Open Sans",
    "Lato",
    "Playfair Display",
    "Oswald",
] as const;
export type WhitelistedFont = (typeof WHITELISTED_FONTS)[number];

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const hexColor = z.string().regex(hexColorRegex, "Invalid hex color");
const optionalUrl = z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || v.startsWith("/") || v.startsWith("https://"), {
        message: "URL must be https or a relative path",
    });

/**
 * themeJson — schema completo de personalização de bilhetes
 */
export const themeJsonSchema = z.object({
    brand: z.object({
        logoUrl: optionalUrl,
        tagline: z.string().max(100).optional(),
        logoSize: z.enum(["sm", "md", "lg"]).optional(),
        logoPosition: z.enum(["left", "center", "right"]).optional(),
        headerStyle: z.enum(["standard", "minimal", "bold"]).optional(),
        watermarkText: z.string().max(24).optional().or(z.literal("")),
        backgroundUrl: optionalUrl,
    }),
    colors: z.object({
        bg: hexColor,
        card: hexColor,
        text: hexColor,
        primary: hexColor,
        muted: hexColor,
        accent: hexColor.optional(),
        qrBackground: hexColor.optional(),
    }),
    typography: z.object({
        fontFamily: z.enum(WHITELISTED_FONTS),
        titleSize: z.enum(["sm", "md", "lg", "xl"]).optional(),
        bodySize: z.enum(["sm", "md", "lg"]).optional(),
        titleWeight: z.enum(["semibold", "bold", "extrabold"]).optional(),
        uppercaseLabels: z.boolean().optional(),
    }),
    qr: z.object({
        size: z.enum(["S", "M", "L"]),
        label: z.string().max(50).optional(),
        background: hexColor.optional(),
        borderRadius: z.enum(["none", "sm", "md", "lg"]).optional(),
        frameStyle: z.enum(["none", "light", "accent", "bold"]).optional(),
    }),
    blocks: z.object({
        showBuyerName: z.boolean().default(true),
        showOrderId: z.boolean().default(true),
        showTicketType: z.boolean().default(true),
        showTerms: z.boolean().default(true),
        showSupport: z.boolean().default(true),
        showEventTitle: z.boolean().default(true),
        showVenue: z.boolean().default(true),
        showCity: z.boolean().default(true),
        showDate: z.boolean().default(true),
        showTicketCode: z.boolean().default(true),
        showOrganization: z.boolean().default(true),
        customTerms: z.string().max(400).optional().or(z.literal("")),
        badgeText: z.string().max(50).optional().or(z.literal("")),
    }),
    footer: z.object({
        supportUrl: z.string().url().startsWith("https://").optional().or(z.literal("")),
        supportEmail: z.string().email().optional().or(z.literal("")),
    }),
    layout: z.object({
        accentStyle: z.enum(["bar", "gradient", "none"]).optional(),
        cardStyle: z.enum(["elevated", "flat", "bordered"]).optional(),
        cornerRadius: z.enum(["sm", "md", "lg"]).optional(),
        pagePadding: z.enum(["none", "sm", "md", "lg"]).optional(),
        pageWidth: z.enum(["compact", "standard", "wide"]).optional(),
        contentAlign: z.enum(["left", "center"]).optional(),
        dividerStyle: z.enum(["solid", "dashed", "dotted", "none"]).optional(),
        backgroundPattern: z.enum(["none", "dots", "grid", "diagonal"]).optional(),
    }).optional(),
    copy: z.object({
        labelBuyer: z.string().max(30).optional(),
        labelVenue: z.string().max(30).optional(),
        labelDate: z.string().max(30).optional(),
        labelTicketType: z.string().max(30).optional(),
        labelTicketCode: z.string().max(30).optional(),
        labelBadge: z.string().max(30).optional(),
    }).optional(),
});

export type ThemeJson = z.infer<typeof themeJsonSchema>;

export const TICKET_TEMPLATE_PRESETS = [
    "A4_CLASSIC",
    "HORIZONTAL_QR_RIGHT",
    "MOBILE_PASS",
] as const;

export type TicketTemplatePreset = typeof TICKET_TEMPLATE_PRESETS[number];

import { TicketTemplateStatus } from "@prisma/client";
export { TicketTemplateStatus };

export interface TicketRenderModel {
    ticket: {
        id: string;
        code: string;
        qrPayload: string;
        status: string;
        qrDataUrl?: string;
    };
    event: {
        title: string;
        venue: string;
        city: string;
        startAt: Date;
        endAt: Date;
        organizationName: string;
    };
    buyer: {
        name: string;
        email: string;
    };
    order: {
        id: string;
    };
    ticketLot: {
        name: string;
    };
}
