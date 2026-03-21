import { prisma } from "@/lib/prisma";
import { chromium } from "playwright";
import { ThemeJson, TicketRenderModel, TicketTemplatePreset, TicketTemplateStatus } from "../ticket-templates/models";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import crypto from "crypto";

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
      // Find ACTIVE template for org
      activeTemplate = await prisma.organizationTicketTemplate.findFirst({
        where: {
          organizationId: ticket.event.organizationId,
          status: TicketTemplateStatus.ACTIVE,
        },
      });
    }

    if (!activeTemplate) {
      // Create a fallback snapshot
      const defaultTheme: ThemeJson = {
        brand: { logoUrl: "", tagline: "" },
        colors: {
          bg: "#ffffff",
          card: "#ffffff",
          text: "#111111",
          primary: "#19c37d",
          muted: "#666666",
        },
        typography: { fontFamily: "Inter" },
        qr: { size: "M", label: "Validar na entrada" },
        blocks: {
          showBuyerName: true,
          showOrderId: true,
          showTicketType: true,
          showTerms: true,
          showSupport: true,
        },
        footer: { supportUrl: "", supportEmail: "" },
      };

      const preset = "A4_CLASSIC";
      const model = await this.buildRenderModel(ticketId);
      const html = this.generateHtml(preset, model, defaultTheme);
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
    const html = this.generateHtml(preset, model, activeTemplate.themeJson as any);
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
   * Renders the ticket to PDF buffer using Playwright
   */
  async renderPdf(ticketId: string, templateId?: string): Promise<Buffer> {
    const model = await this.buildRenderModel(ticketId);

    let theme: ThemeJson;
    let preset: TicketTemplatePreset;

    if (templateId) {
      // Preview mode
      const template = await prisma.organizationTicketTemplate.findUnique({
        where: { id: templateId },
      });
      if (!template) throw new Error("Template não encontrado");
      theme = template.themeJson as unknown as ThemeJson;
      preset = template.preset as TicketTemplatePreset;
    } else {
      // Production mode (use snapshot)
      const snapshot = await this.resolveSnapshot(ticketId);
      theme = snapshot.themeJson as unknown as ThemeJson;
      preset = snapshot.preset as TicketTemplatePreset;
    }

    const defaultTheme: ThemeJson = {
      brand: { logoUrl: "", tagline: "" },
      colors: {
        bg: "#ffffff",
        card: "#ffffff",
        text: "#111111",
        primary: "#19c37d",
        muted: "#666666",
      },
      typography: { fontFamily: "Inter" },
      qr: { size: "M", label: "Validar na entrada" },
      blocks: {
        showBuyerName: true,
        showOrderId: true,
        showTicketType: true,
        showTerms: true,
        showSupport: true,
      },
      footer: { supportUrl: "", supportEmail: "" },
    };

    const safeTheme: ThemeJson = {
      brand: { ...defaultTheme.brand, ...(theme?.brand || {}) },
      colors: { ...defaultTheme.colors, ...(theme?.colors || {}) },
      typography: { ...defaultTheme.typography, ...(theme?.typography || {}) },
      qr: { ...defaultTheme.qr, ...(theme?.qr || {}) },
      blocks: { ...defaultTheme.blocks, ...(theme?.blocks || {}) },
      footer: { ...defaultTheme.footer, ...(theme?.footer || {}) },
    };

    if (safeTheme.brand.logoUrl && safeTheme.brand.logoUrl.startsWith("/")) {
      const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      safeTheme.brand.logoUrl = `${baseUrl}${safeTheme.brand.logoUrl}`;
    }

    const html = this.generateHtml(preset, model, safeTheme);

    // Playwright rendering
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  },

  /**
   * Generates the HTML string for the ticket
   */
  generateHtml(preset: TicketTemplatePreset, model: TicketRenderModel, theme: ThemeJson): string {
    const formatDate = (date: Date) => format(date, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=${theme.typography.fontFamily}:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: '${theme.typography.fontFamily}', sans-serif;
            margin: 0;
            padding: 0;
            background-color: ${theme.colors.bg};
            color: ${theme.colors.text};
            -webkit-print-color-adjust: exact;
          }
          .ticket-container {
            width: 210mm;
            height: 297mm;
            padding: 20mm;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }
          .card {
            background-color: ${theme.colors.card};
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            flex: 1;
            display: flex;
            flex-direction: column;
            border: 1px solid rgba(0,0,0,0.05);
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
          }
          .logo {
            max-height: 60px;
          }
          .event-title {
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 10px 0;
            color: ${theme.colors.primary};
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }
          .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${theme.colors.muted};
            margin-bottom: 5px;
          }
          .value {
            font-size: 16px;
            font-weight: 600;
          }
          .qr-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: auto;
            padding-top: 40px;
            border-top: 1px dashed ${theme.colors.muted}44;
          }
          .qr-code {
            width: ${theme.qr.size === 'L' ? '200px' : theme.qr.size === 'M' ? '150px' : '100px'};
            height: ${theme.qr.size === 'L' ? '200px' : theme.qr.size === 'M' ? '150px' : '100px'};
            background-color: #fff;
            padding: 10px;
            border-radius: 12px;
            margin-bottom: 15px;
          }
          .qr-label {
            font-size: 14px;
            color: ${theme.colors.muted};
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: ${theme.colors.muted};
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <div class="card">
            <div class="header">
              <div>
                ${theme.brand.logoUrl ? `<img src="${theme.brand.logoUrl}" class="logo" />` : `<h2 style="margin:0">${model.event.organizationName}</h2>`}
                ${theme.brand.tagline ? `<p style="margin:5px 0; font-size:14px; color:${theme.colors.muted}">${theme.brand.tagline}</p>` : ""}
              </div>
              <div style="text-align: right">
                <div class="label">Código do Bilhete</div>
                <div class="value" style="font-family: monospace; font-size: 18px">${model.ticket.code}</div>
              </div>
            </div>

            <h1 class="event-title">${model.event.title}</h1>
            
            <div class="info-grid">
              <div>
                <div class="label">Local</div>
                <div class="value">${model.event.venue}<br/>${model.event.city}</div>
              </div>
              <div>
                <div class="label">Data e Hora</div>
                <div class="value">${formatDate(model.event.startAt)}</div>
              </div>
              
              ${theme.blocks.showBuyerName ? `
              <div>
                <div class="label">Titular</div>
                <div class="value">${model.buyer.name}</div>
              </div>
              ` : ""}
              
              ${theme.blocks.showTicketType ? `
              <div>
                <div class="label">Tipo de Bilhete</div>
                <div class="value">${model.ticketLot.name}</div>
              </div>
              ` : ""}
            </div>

            <div class="qr-section">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(model.ticket.qrPayload)}" class="qr-code" />
              <div class="qr-label">${theme.qr.label || "Validar na entrada"}</div>
            </div>

            <div class="footer">
              ${theme.blocks.showOrderId ? `<p>Encomenda: ${model.order.id}</p>` : ""}
              ${theme.blocks.showSupport && theme.footer.supportEmail ? `<p>Suporte: ${theme.footer.supportEmail}</p>` : ""}
              ${theme.footer.supportUrl ? `<p>${theme.footer.supportUrl}</p>` : ""}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};
