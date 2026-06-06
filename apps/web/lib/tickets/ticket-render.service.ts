import { prisma } from "@/lib/prisma";
import { ThemeJson, TicketRenderModel, TicketTemplatePreset, TicketTemplateStatus } from "../ticket-templates/models";
import { DEFAULT_TICKET_THEME, mergeTicketTheme, normalizeTicketTheme } from "../ticket-templates/default-theme";
import crypto from "crypto";
import { generateSimpleTicketPDF } from "./simple-ticket-pdf";
import { renderTicketHtml, qrDisplaySizePx } from "./ticket-html-templates";
import { tryRenderHtmlToPdf } from "../pdf/html-to-pdf";
import { urlToDataUri } from "../pdf/inline-assets";
import { safeLog } from "../security";
import QRCode from "qrcode";

const DEFAULT_THEME: ThemeJson = DEFAULT_TICKET_THEME;

function mergeTheme(theme?: ThemeJson): ThemeJson {
  return mergeTicketTheme(normalizeTicketTheme(theme));
}

async function inlineThemeAssets(theme: ThemeJson): Promise<ThemeJson> {
  let next = theme;
  if (theme.brand.logoUrl) {
    const inlined = await urlToDataUri(theme.brand.logoUrl);
    if (inlined) {
      next = { ...next, brand: { ...next.brand, logoUrl: inlined } };
    }
  }
  if (theme.brand.backgroundUrl) {
    const inlinedBg = await urlToDataUri(theme.brand.backgroundUrl);
    if (inlinedBg) {
      next = { ...next, brand: { ...next.brand, backgroundUrl: inlinedBg } };
    }
  }
  return next;
}

async function fetchActiveTemplateForTicket(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { event: true },
  });

  if (!ticket?.event.organizationId) {
    return null;
  }

  if (ticket.event.ticketTemplateId) {
    const assigned = await prisma.organizationTicketTemplate.findUnique({
      where: { id: ticket.event.ticketTemplateId },
    });
    if (assigned) return assigned;
  }

  return prisma.organizationTicketTemplate.findFirst({
    where: {
      organizationId: ticket.event.organizationId,
      status: TicketTemplateStatus.ACTIVE,
    },
  });
}

async function inlineThemeLogo(theme: ThemeJson): Promise<ThemeJson> {
  return inlineThemeAssets(theme);
}

export const TicketRenderService = {
  /**
   * Resolves the snapshot for a ticket.
   * If it doesn't exist, creates one from the organization's ACTIVE template.
   */
  async resolveSnapshot(ticketId: string) {
    const existing = await prisma.ticketRenderSnapshot.findUnique({
      where: { ticketId },
    });

    if (existing) return existing;

    // Fetch ticket with event and organization info
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new Error("Bilhete não encontrado");
    }

    let activeTemplate = null;

    if (ticket.event.organizationId) {
      // Prioritize the event's assigned template
      if (ticket.event.ticketTemplateId) {
        activeTemplate = await prisma.organizationTicketTemplate.findUnique({
          where: { id: ticket.event.ticketTemplateId },
        });
      }

      // Fallback to the organization's ACTIVE template if none assigned or the assigned one was deleted
      if (!activeTemplate) {
        activeTemplate = await prisma.organizationTicketTemplate.findFirst({
          where: {
            organizationId: ticket.event.organizationId,
            status: TicketTemplateStatus.ACTIVE,
          },
        });
      }
    }

    if (!activeTemplate) {
      // Create a fallback snapshot
      const defaultTheme: ThemeJson = DEFAULT_THEME;

      const preset = "A4_CLASSIC";
      const model = await this.buildRenderModel(ticketId);
      const html = renderTicketHtml(preset, model, defaultTheme);
      const htmlHash = crypto.createHash("sha256").update(html).digest("hex");

      return prisma.ticketRenderSnapshot.create({
        data: {
          ticketId,
          organizationId: ticket.event.organizationId || "fallback",
          templateId: "fallback-template",
          templateVersion: 1,
          preset,
          themeJson: defaultTheme as any,
          htmlHash,
          pdfPath: null,
        },
      });
    }

    const preset = activeTemplate.preset as TicketTemplatePreset;
    const model = await this.buildRenderModel(ticketId);
    const html = renderTicketHtml(preset, model, activeTemplate.themeJson as any);
    const htmlHash = crypto.createHash("sha256").update(html).digest("hex");

    // Create snapshot
    return prisma.ticketRenderSnapshot.create({
      data: {
        ticketId,
        organizationId: ticket.event.organizationId || "fallback",
        templateId: activeTemplate.id,
        templateVersion: activeTemplate.version,
        preset,
        themeJson: activeTemplate.themeJson as any,
        htmlHash,
        pdfPath: null,
      },
    });
  },

  /**
   * Build the render model for a ticket
   */
  async buildRenderModel(ticketId: string): Promise<TicketRenderModel> {
    if (ticketId === "SAMPLE") {
      return this.generateSampleModel();
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: {
          include: {
            organization: true,
          },
        },
        user: true,
        order: true,
        ticketLot: true,
      },
    });

    if (!ticket) throw new Error("Ticket not found");

    return {
      ticket: {
        id: ticket.id,
        code: ticket.code,
        qrPayload: ticket.qrPayload,
        status: ticket.status,
      },
      event: {
        title: ticket.event.title,
        venue: ticket.event.venue,
        city: ticket.event.city,
        startAt: ticket.event.startAt,
        endAt: ticket.event.endAt,
        organizationName: ticket.event.organization?.name || "Organizador",
      },
      buyer: {
        name: ticket.order.buyerName || ticket.user.name || "João Exemplo",
        email: ticket.order.buyerEmail || ticket.user.email,
      },
      order: {
        id: ticket.order.id,
      },
      ticketLot: {
        name: ticket.ticketLot.name,
      },
    };
  },

  /**
   * Generates sample data for previews
   */
  generateSampleModel(): TicketRenderModel {
    return {
      ticket: {
        id: "sample-ticket",
        code: "ABC-123-456",
        qrPayload: "https://tickets.daowave.pt/sample",
        status: "VALID",
      },
      event: {
        title: "Nome do Evento",
        venue: "Nome do Local",
        city: "Cidade",
        startAt: new Date(Date.now() + 86400000),
        endAt: new Date(Date.now() + 86400000 + 3600000),
        organizationName: "Sua Organização",
      },
      buyer: {
        name: "João Exemplo",
        email: "joao@exemplo.com",
      },
      order: {
        id: "ORD-999-X",
      },
      ticketLot: {
        name: "Entrada Geral",
      },
    };
  },

  /**
   * Template ACTIVE atual (ignora snapshot antigo — usa design do dashboard)
   */
  async resolveLiveRenderContext(
    ticketId: string
  ): Promise<{ model: TicketRenderModel; preset: TicketTemplatePreset; theme: ThemeJson }> {
    const model = await this.buildRenderModel(ticketId);
    const activeTemplate = await fetchActiveTemplateForTicket(ticketId);

    if (!activeTemplate) {
      return {
        model,
        preset: "A4_CLASSIC",
        theme: mergeTheme(DEFAULT_THEME),
      };
    }

    return {
      model,
      preset: activeTemplate.preset as TicketTemplatePreset,
      theme: mergeTheme(activeTemplate.themeJson as ThemeJson),
    };
  },

  /**
   * Resolve template theme + preset for rendering
   */
  async resolveRenderContext(
    ticketId: string,
    templateId?: string
  ): Promise<{ model: TicketRenderModel; preset: TicketTemplatePreset; theme: ThemeJson }> {
    const model = await this.buildRenderModel(ticketId);

    let theme: ThemeJson;
    let preset: TicketTemplatePreset;

    if (templateId) {
      const template = await prisma.organizationTicketTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) throw new Error("Template não encontrado");
      theme = template.themeJson as unknown as ThemeJson;
      preset = template.preset as TicketTemplatePreset;
    } else {
      const snapshot = await this.resolveSnapshot(ticketId);
      theme = snapshot.themeJson as unknown as ThemeJson;
      preset = snapshot.preset as TicketTemplatePreset;
    }

    return { model, preset, theme: mergeTheme(theme) };
  },

  /**
   * Renders HTML from draft settings (live preview — não precisa de guardar)
   */
  async renderHtmlDraft(
    ticketId: string,
    preset: TicketTemplatePreset,
    theme: ThemeJson
  ): Promise<string> {
    const model = await this.buildRenderModel(ticketId);
    return renderTicketHtml(preset, model, mergeTheme(theme));
  },

  /**
   * Renders the ticket as HTML (no Playwright — works in production)
   */
  async renderHtml(ticketId: string, templateId?: string): Promise<string> {
    const { model, preset, theme } = await this.resolveRenderContext(ticketId, templateId);
    return renderTicketHtml(preset, model, theme);
  },

  /**
   * Renders the ticket to PDF buffer (HTML template via Playwright, pdfkit fallback)
   */
  async renderPdf(ticketId: string, templateId?: string): Promise<Buffer> {
    const { model, preset, theme: baseTheme } = templateId
      ? await this.resolveRenderContext(ticketId, templateId)
      : await this.resolveLiveRenderContext(ticketId);

    const theme = await inlineThemeLogo(baseTheme);
    const qrSize = qrDisplaySizePx(theme.qr.size);
    const qrDataUrl = await QRCode.toDataURL(model.ticket.qrPayload || model.ticket.code, {
      width: qrSize * 2,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    const modelForHtml: TicketRenderModel = {
      ...model,
      ticket: { ...model.ticket, qrDataUrl },
    };

    const html = renderTicketHtml(preset, modelForHtml, theme);

    const fromHtml = await tryRenderHtmlToPdf(html, {
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      fitSelector: ".ticket-page",
    });
    if (fromHtml) {
      return fromHtml;
    }

    safeLog.warn("Ticket PDF: a usar fallback basico (npm run pdf:setup na VPS para design do dashboard)", {
      ticketId,
    });
    return generateSimpleTicketPDF({
      code: model.ticket.code,
      eventTitle: model.event.title,
      eventDate: model.event.startAt,
      venue: model.event.venue,
      city: model.event.city,
      buyerName: model.buyer.name,
      qrPayload: model.ticket.qrPayload || model.ticket.code,
      preset,
    });
  },
};
