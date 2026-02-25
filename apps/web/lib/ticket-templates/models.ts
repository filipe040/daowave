import { z } from "zod";

/**
 * Whitelist for fonts (MVP)
 */
export const WHITELISTED_FONTS = ["Inter", "Roboto", "Poppins"] as const;
export type WhitelistedFont = (typeof WHITELISTED_FONTS)[number];

/**
 * Regex for Hex color validation
 */
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * themeJson Strict Schema
 */
export const themeJsonSchema = z.object({
    brand: z.object({
        logoUrl: z.string().url().startsWith("https://").optional().or(z.literal("")),
        tagline: z.string().max(100).optional(),
    }),
    colors: z.object({
        bg: z.string().regex(hexColorRegex, "Invalid hex color"),
        card: z.string().regex(hexColorRegex, "Invalid hex color"),
        text: z.string().regex(hexColorRegex, "Invalid hex color"),
        primary: z.string().regex(hexColorRegex, "Invalid hex color"),
        muted: z.string().regex(hexColorRegex, "Invalid hex color"),
    }),
    typography: z.object({
        fontFamily: z.enum(WHITELISTED_FONTS),
    }),
    qr: z.object({
        size: z.enum(["S", "M", "L"]),
        label: z.string().max(50).optional(),
    }),
    blocks: z.object({
        showBuyerName: z.boolean().default(true),
        showOrderId: z.boolean().default(true),
        showTicketType: z.boolean().default(true),
        showTerms: z.boolean().default(true),
        showSupport: z.boolean().default(true),
    }),
    footer: z.object({
        supportUrl: z.string().url().startsWith("https://").optional().or(z.literal("")),
        supportEmail: z.string().email().optional().or(z.literal("")),
    }),
});

export type ThemeJson = z.infer<typeof themeJsonSchema>;

export const TICKET_TEMPLATE_PRESETS = [
    "A4_CLASSIC",
    "HORIZONTAL_QR_RIGHT",
    "MOBILE_PASS"
] as const;

export type TicketTemplatePreset = typeof TICKET_TEMPLATE_PRESETS[number];

import { TicketTemplateStatus } from "@prisma/client";
export { TicketTemplateStatus };

/**
 * Render Model (Data needed to fill the template)
 */
export interface TicketRenderModel {
    ticket: {
        id: string;
        code: string;
        qrPayload: string;
        status: string;
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
