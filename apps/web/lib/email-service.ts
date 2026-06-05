/**
 * Central Email Service
 * Unified email sending with templates, idempotency, and logging
 */

import { Resend } from "resend";
import { prisma } from "./prisma";
import { getEmailConfig, maskEmail, hashEmail } from "./config/email";
import { safeLog } from "./security";
import crypto from "crypto";
import {
  getTicketEmailTemplate,
  getOrderConfirmationEmailTemplate,
  getPasswordResetEmailTemplate,
  getVerifyEmailTemplate,
  getTicketTransferTemplate,
  getOrganizationInviteTemplate,
  getEventReminderTemplate,
  getPostEventThankYouTemplate,
  getPromoterDailyReportTemplate
} from "./email-templates-transactional";
import { getMarketingCampaignTemplate } from "./email-templates";
import { getEmailQueue } from "./queue/email.queue";
import { generateSimpleTicketPDF, generateSimpleInvoicePDF } from "./tickets/simple-ticket-pdf";

export type EmailTemplate =
  | "verify-email"
  | "reset-password"
  | "order-confirmed"
  | "ticket-delivery"
  | "ticket-transfer"
  | "invite-organization"
  | "event-reminder-24h"
  | "post-event-thankyou"
  | "promoter-daily-report"
  | "marketing-campaign";

export interface SendTemplateOptions {
  to: string;
  templateId: EmailTemplate;
  variables: Record<string, any>;
  idempotencyKey?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SendHtmlOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  emailLogId: string;
  messageId?: string;
  error?: string;
}

let resendClient: Resend | null = null;

/**
 * Get Resend client (singleton)
 */
function getResendClient(): Resend {
  if (!resendClient) {
    const config = getEmailConfig();
    if (!config.resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Trim whitespace and remove quotes if present
    const cleanApiKey = config.resendApiKey.trim().replace(/^["']|["']$/g, '');

    if (!cleanApiKey.startsWith('re_')) {
      throw new Error(`Invalid RESEND_API_KEY format. Expected key starting with "re_", got: ${cleanApiKey.substring(0, 10)}...`);
    }

    resendClient = new Resend(cleanApiKey);
  }
  return resendClient;
}

/**
 * Check idempotency - prevent duplicate emails for the SAME exact operation
 */
async function checkIdempotency(
  idempotencyKey: string,
  template: EmailTemplate,
  to: string
): Promise<{ isDuplicate: boolean; existingLogId?: string }> {
  if (!idempotencyKey) {
    return { isDuplicate: false };
  }

  try {
    // Only block if we find a SENT email with the EXACT same idempotency key
    const existing = await prisma.emailLog.findFirst({
      where: {
        status: "SENT",
        template,
        to: to.toLowerCase().trim(),
      },
      orderBy: { createdAt: "desc" },
    });

    // Require the exact idempotency key to match — never block if keys differ or are missing
    const isExactMatch =
      existing &&
      existing.meta &&
      typeof existing.meta === "object" &&
      (existing.meta as Record<string, unknown>).idempotencyKey === idempotencyKey;

    return {
      isDuplicate: !!isExactMatch,
      existingLogId: isExactMatch ? existing!.id : undefined,
    };
  } catch (error: any) {
    safeLog.warn("EmailLog query failed, skipping idempotency check", { error: error.message });
    return { isDuplicate: false };
  }
}



/**
 * Create email log entry
 */
async function createEmailLog(
  to: string,
  subject: string,
  template: EmailTemplate | null,
  idempotencyKey?: string,
  relatedOrderId?: string,
  relatedTicketId?: string,
  relatedUserId?: string
) {
  const toHash = await hashEmail(to);

  try {
    return await prisma.emailLog.create({
      data: {
        id: crypto.randomUUID(),
        to: to.toLowerCase().trim(),
        subject,
        template: template || null,
        type: template || null,
        status: "PENDING",
        relatedOrderId: relatedOrderId || null,
        relatedTicketId: relatedTicketId || null,
        relatedUserId: relatedUserId || null,
        ipAddress: (typeof process !== "undefined" && (process as any).env && (process as any).env.MOCK_IP) ? (process as any).env.MOCK_IP : null,
        meta: idempotencyKey ? { idempotencyKey } : undefined,
      },
    });
  } catch (error: any) {
    // If EmailLog table doesn't exist, create a dummy log object
    // This allows emails to be sent even if logging fails
    safeLog.warn("EmailLog table not found, skipping email logging", { error: error.message });
    return {
      id: crypto.randomUUID(),
      to: to.toLowerCase().trim(),
      subject,
      template: template || null,
      type: template || null,
      status: "PENDING" as const,
      sentAt: null,
      error: null,
      retryCount: 0,
      providerMessageId: null,
      relatedOrderId: relatedOrderId || null,
      relatedTicketId: relatedTicketId || null,
      relatedUserId: relatedUserId || null,
      ipAddress: null,
      meta: idempotencyKey ? { idempotencyKey } : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Update email log with result
 */
async function updateEmailLog(
  emailLogId: string,
  status: "SENT" | "FAILED",
  providerMessageId?: string,
  error?: string,
  retryCount?: number
) {
  try {
    await prisma.emailLog.update({
      where: { id: emailLogId },
      data: {
        status,
        providerMessageId: providerMessageId || undefined,
        sentAt: status === "SENT" ? new Date() : undefined,
        error: error || undefined,
        retryCount: retryCount ?? 0,
      },
    });
  } catch (error: any) {
    // If EmailLog table doesn't exist, just log the warning
    // This is OK - the email may still have been sent
    safeLog.warn("EmailLog table not found, skipping email log update", {
      emailLogId,
      status,
      error: error.message
    });
  }
}

/**
 * Enqueue an email using BullMQ (replaces direct sending)
 */
export async function enqueueTemplate(options: SendTemplateOptions): Promise<{ success: boolean; message: string; jobId?: string }> {
  const config = getEmailConfig();

  if (!config.enabled) {
    safeLog.warn("Emails are disabled", { template: options.templateId, to: maskEmail(options.to) });
    return { success: false, message: "Emails are disabled" };
  }

  // Create EmailJobLog entry first
  let jobLogId = "";
  let idempotencyKey = options.idempotencyKey || `job-${Date.now()}-${options.to}`;

  try {
    // Map templateId to EmailJobType
    const typeMapping: Record<string, string> = {
      "verify-email": "VERIFY_EMAIL",
      "invite-organization": "ORG_INVITE",
      "order-confirmed": "PURCHASE_CONFIRMATION",
      "ticket-delivery": "PURCHASE_CONFIRMATION", // Or appropriate mapping
      "event-reminder-24h": "EVENT_REMINDER_24H",
      "post-event-thankyou": "POST_EVENT_THANKYOU",
      "promoter-daily-report": "PROMOTER_DAILY_REPORT",
    };

    const jobType = typeMapping[options.templateId] || "PURCHASE_CONFIRMATION";

    const jobLog = await (prisma as any).emailJobLog.upsert({
      where: { idempotencyKey },
      create: {
        toEmail: options.to,
        templateId: options.templateId,
        type: jobType,
        payloadJson: options.variables as any,
        status: "QUEUED",
        idempotencyKey,
      },
      update: {},
    });

    // If it's already SENT, return deduplicated status
    if (jobLog.status === "SENT") {
      safeLog.info("Email duplication prevented at Job level", { idempotencyKey });
      return { success: true, message: "Duplicate prevented", jobId: jobLog.id };
    }

    jobLogId = jobLog.id;
  } catch (err: any) {
    safeLog.warn("Could not create EmailJobLog, proceeding to enqueue anyway", { error: err.message });
  }

  // Add securely to BullMQ
  try {
    const job = await getEmailQueue().add(
      options.templateId,
      {
        to: options.to,
        templateId: options.templateId,
        payload: options.variables,
        emailLogId: jobLogId,
        attachments: options.attachments,
      },
      {
        jobId: idempotencyKey, // deduplication at the queue level
      }
    );

    return { success: true, message: "Queued", jobId: job.id };
  } catch (err: any) {
    safeLog.error("Queue error", { error: err.message });
    // Fallback: If redis is down, mark as FAILED gracefully
    if (jobLogId) {
      await (prisma as any).emailJobLog.update({
        where: { id: jobLogId },
        data: { status: "FAILED", error: "Redis/Queue error: " + err.message },
      }).catch(() => { });
    }
    return { success: false, message: "Queue error" };
  }
}

/**
 * Send email using template — sends directly via Resend (no queue dependency)
 */
export async function sendTemplate(options: SendTemplateOptions): Promise<SendEmailResult> {
  const config = getEmailConfig();

  if (!config.enabled) {
    safeLog.warn("Emails are disabled", { template: options.templateId, to: maskEmail(options.to) });
    return { success: false, emailLogId: "disabled", error: "Emails are disabled" };
  }

  // Check idempotency before sending
  if (options.idempotencyKey) {
    const { isDuplicate, existingLogId } = await checkIdempotency(
      options.idempotencyKey,
      options.templateId,
      options.to
    );
    if (isDuplicate) {
      safeLog.info("Email duplicate prevented", { key: options.idempotencyKey, template: options.templateId });
      return { success: true, emailLogId: existingLogId || "duplicate", messageId: undefined };
    }
  }

  return processTemplateSend(
    options.to,
    options.templateId,
    options.variables,
    undefined,
    options.attachments,
    options.idempotencyKey
  );
}

/**
 * Process the actual raw sending (Worker calls this)
 */
export async function processTemplateSend(
  to: string,
  templateId: string,
  variables: any,
  jobLogId?: string,
  attachments?: any[],
  idempotencyKey?: string
): Promise<SendEmailResult> {
  const config = getEmailConfig();
  if (!config.enabled) {
    safeLog.warn("Emails are disabled", { template: templateId, to: maskEmail(to) });
    return {
      success: false,
      emailLogId: jobLogId || "disabled",
      error: "Emails are disabled",
    };
  }

  // Generate email content from template
  let subject: string;
  let html: string;
  let text: string | undefined;

  switch (templateId) {
    case "verify-email":
      ({ subject, html, text } = getVerifyEmailTemplate(variables as {
        name: string;
        verificationUrl: string;
        expiresIn?: string;
      }));
      break;
    case "reset-password":
      ({ subject, html, text } = getPasswordResetEmailTemplate(variables as {
        name: string;
        resetUrl: string;
        expiresIn?: string;
      }));
      break;
    case "order-confirmed":
      ({ subject, html, text } = getOrderConfirmationEmailTemplate(variables as {
        name: string;
        orderId: string;
        eventTitle: string;
        total: string;
        currency?: string;
      }));
      break;
    case "ticket-delivery":
      ({ subject, html, text } = getTicketEmailTemplate(variables as {
        name: string;
        eventTitle: string;
        eventDate: string;
        venueName: string;
        address: string;
        ticketCount: number;
        downloadLink?: string;
        hasPdfAttachments?: boolean;
        branding?: { primaryColor?: string; secondaryColor?: string; bannerUrl?: string; headerTitle?: string };
        ticketCode?: string;
        qrCodeImageUrl?: string;
      }));
      break;
    case "ticket-transfer":
      ({ subject, html, text } = getTicketTransferTemplate(variables as {
        recipientName: string;
        senderName: string;
        eventTitle: string;
        eventDate: string;
        acceptUrl: string;
        expiresIn?: string;
      }));
      break;
    case "invite-organization":
      ({ subject, html, text } = getOrganizationInviteTemplate(variables as {
        organizationName: string;
        acceptUrl: string;
        expiresIn?: string;
      }));
      break;
    case "event-reminder-24h":
      ({ subject, html, text } = getEventReminderTemplate(variables as {
        name: string;
        eventTitle: string;
        eventDate: string;
        venueName: string;
        address: string;
        ticketUrl: string;
      }));
      break;
    case "post-event-thankyou":
      ({ subject, html, text } = getPostEventThankYouTemplate(variables as {
        name: string;
        eventTitle: string;
        feedbackUrl?: string;
      }));
      break;
    case "promoter-daily-report":
      ({ subject, html, text } = getPromoterDailyReportTemplate(variables as {
        promoterName: string;
        date: string;
        totalSales: string;
        ticketsSold: number;
        upcomingEvents: Array<{ title: string; date: string; sold: number }>;
      }));
      break;
    case "marketing-campaign":
      {
        const v = variables as { subject: string; title: string; content: string };
        subject = v.subject;
        html = getMarketingCampaignTemplate(v.subject, v.title, v.content);
        text = v.content.replace(/<[^>]*>?/gm, ''); // simple strip tags for text fallback
      }
      break;
    default:
      throw new Error(`Unknown template ID: ${templateId}`);
  }

  // Create email log fallback if needed
  const emailLog = await createEmailLog(
    to,
    subject,
    templateId,
    undefined,
    variables.orderId,
    variables.ticketId,
    variables.userId
  );

  try {
    const client = getResendClient();

    // Prepare attachments
    const preparedAttachments = attachments?.map((att) => ({
      filename: att.filename,
      content: att.content instanceof Buffer ? att.content.toString("base64") : att.content,
      contentType: att.contentType,
    }));

    const result = await client.emails.send({
      from: config.from,
      to: to,
      replyTo: config.replyTo,
      subject,
      html,
      text,
      attachments: preparedAttachments,
    });

    if (result.error) {
      await updateEmailLog(emailLog.id, "FAILED", undefined, result.error.message, 1);

      // Log detalhado do erro para debug
      safeLog.error("Email send failed", {
        template: templateId,
        to: maskEmail(to),
        error: result.error.message,
        errorName: result.error.name,
        errorCode: result.error.statusCode,
        // Não logar a API key completa por segurança
        apiKeyPrefix: config.resendApiKey?.substring(0, 10) || 'missing',
      });

      // Mensagem mais útil para o utilizador
      let errorMessage = result.error.message;
      if (result.error.message?.includes('invalid') || result.error.message?.includes('API key')) {
        errorMessage = `API key inválida. Verifique se a RESEND_API_KEY está correta e ativa no Resend Dashboard. Erro: ${result.error.message}`;
      }

      return {
        success: false,
        emailLogId: emailLog.id,
        error: errorMessage,
      };
    }

    await updateEmailLog(emailLog.id, "SENT", result.data?.id);
    safeLog.info("Email sent successfully", {
      template: templateId,
      to: maskEmail(to),
      messageId: result.data?.id,
    });

    return {
      success: true,
      emailLogId: emailLog.id,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    await updateEmailLog(emailLog.id, "FAILED", undefined, error.message, 1);
    safeLog.error("Email send error", {
      template: templateId,
      to: maskEmail(to),
      error: error.message,
    });
    return {
      success: false,
      emailLogId: emailLog.id,
      error: error.message,
    };
  }
}

/**
 * Send email with custom HTML
 */
export async function sendHtml(options: SendHtmlOptions): Promise<SendEmailResult> {
  const config = getEmailConfig();

  if (!config.enabled) {
    safeLog.warn("Emails are disabled", { to: maskEmail(options.to) });
    const log = await createEmailLog(options.to, options.subject, null, options.idempotencyKey);
    await updateEmailLog(log.id, "FAILED", undefined, "Emails are disabled");
    return {
      success: false,
      emailLogId: log.id,
      error: "Emails are disabled",
    };
  }

  // Check idempotency
  if (options.idempotencyKey) {
    const existing = await prisma.emailLog.findFirst({
      where: {
        meta: {
          path: "idempotencyKey",
          equals: options.idempotencyKey,
        },
        status: "SENT",
        to: options.to.toLowerCase().trim(),
      },
    });

    if (existing) {
      return {
        success: false,
        emailLogId: existing.id,
        error: "Email already sent (idempotency check)",
      };
    }
  }

  const emailLog = await createEmailLog(options.to, options.subject, null, options.idempotencyKey);

  try {
    const client = getResendClient();

    const attachments = options.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content instanceof Buffer ? att.content.toString("base64") : att.content,
      contentType: att.contentType,
    }));

    const result = await client.emails.send({
      from: config.from,
      to: options.to,
      replyTo: config.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments,
    });

    if (result.error) {
      await updateEmailLog(emailLog.id, "FAILED", undefined, result.error.message, 1);
      return {
        success: false,
        emailLogId: emailLog.id,
        error: result.error.message,
      };
    }

    await updateEmailLog(emailLog.id, "SENT", result.data?.id);
    return {
      success: true,
      emailLogId: emailLog.id,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    await updateEmailLog(emailLog.id, "FAILED", undefined, error.message, 1);
    return {
      success: false,
      emailLogId: emailLog.id,
      error: error.message,
    };
  }
}

/**
 * Send login notification email — rich version with device/location/reset link
 */
export async function sendLoginNotificationEmail(
  to: string,
  name: string,
  loginInfo: { ip: string; userAgent: string | null; timestamp: Date },
  richInfo?: { device: string; location: string; timestamp: string; resetUrl: string }
): Promise<void> {
  try {
    const { getLoginNotificationTemplate } = await import("./email-templates-transactional");
    const tpl = getLoginNotificationTemplate({
      name,
      ip: loginInfo.ip || "Desconhecido",
      device: richInfo?.device || "Desconhecido",
      location: richInfo?.location || "Desconhecida",
      timestamp: richInfo?.timestamp || loginInfo.timestamp.toLocaleString("pt-PT"),
      resetUrl: richInfo?.resetUrl || `${process.env.APP_URL || "https://tickets.daowave.pt"}/auth/forgot-password`,
    });

    await EmailService.sendHtml({
      to,
      subject: tpl.subject,
      html: tpl.html,
      idempotencyKey: `login-notification-${to}-${loginInfo.timestamp.getTime()}`,
    });
  } catch (err: any) {
    safeLog.error("Failed to send login notification email", { to: maskEmail(to), error: err.message });
  }
}


export async function sendTicketsEmail(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: {
          include: {
            organization: true,
          },
        },
        user: true,
        tickets: true,
        items: {
          include: {
            ticketLot: true,
          },
        },
      },
    });

    if (!order || !order.user || !order.event) {
      safeLog.error("Missing data for ticket email", { orderId });
      return;
    }

    if (order.tickets.length === 0) {
      safeLog.error("No tickets to email for order", { orderId });
      return;
    }

    const { user, event, tickets } = order;
    const recipientEmail = (order.buyerEmail || user.email).toLowerCase().trim();
    const recipientName = order.buyerName || user.name || "Cliente";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://tickets.daowave.pt";

    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];

    // -- Invoice PDF --
    const invoiceNumber = `REC-${order.createdAt.getFullYear()}-${order.id.substring(0, 8).toUpperCase()}`;
    try {
      const { generateInvoicePDF, buildInvoiceData } = await import("./invoice/invoice-pdf.service");
      const invoiceData = buildInvoiceData(order as any);
      const pdfBuffer = await generateInvoicePDF(invoiceData);
      attachments.push({
        filename: `fatura-${invoiceData.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      });
      safeLog.info("Invoice PDF generated", { orderId, invoiceNumber: invoiceData.invoiceNumber });
    } catch (pdfErr: any) {
      safeLog.warn("Invoice PDF render failed, using fallback", { orderId, error: pdfErr.message });
      try {
        const fallback = await generateSimpleInvoicePDF({
          invoiceNumber,
          eventTitle: event.title,
          orderId: order.id,
          buyerName: recipientName,
          buyerEmail: recipientEmail,
          totalCents: order.totalCents,
          currency: order.currency,
          items: order.items.map((item) => ({
            name: item.ticketLot.name,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
        });
        attachments.push({
          filename: `fatura-${invoiceNumber}.pdf`,
          content: fallback,
          contentType: "application/pdf",
        });
      } catch (fallbackErr: any) {
        safeLog.error("Simple invoice PDF fallback failed", { orderId, error: fallbackErr.message });
      }
    }

    // -- Ticket PDFs (Playwright design, fallback to simple PDF) --
    const { TicketRenderService } = await import("./tickets/ticket-render.service");

    for (const ticket of tickets) {
      const filename = `bilhete-${ticket.code}.pdf`;
      try {
        const pdfBuffer = await TicketRenderService.renderPdf(ticket.id);
        attachments.push({ filename, content: pdfBuffer, contentType: "application/pdf" });
      } catch (ticketPdfErr: any) {
        safeLog.warn("Ticket PDF render failed, using fallback", {
          orderId,
          ticketId: ticket.id,
          error: ticketPdfErr.message,
        });
        try {
          const fallback = await generateSimpleTicketPDF({
            code: ticket.code,
            eventTitle: event.title,
            eventDate: event.startAt,
            venue: event.venue || "",
            city: event.city || "",
            buyerName: recipientName,
          });
          attachments.push({ filename, content: fallback, contentType: "application/pdf" });
        } catch (fallbackErr: any) {
          safeLog.error("Simple ticket PDF fallback failed", {
            orderId,
            ticketId: ticket.id,
            error: fallbackErr.message,
          });
        }
      }
    }

    const variables = {
      name: recipientName,
      eventTitle: event.title,
      eventDate: event.startAt
        ? new Date(event.startAt).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })
        : "Data a anunciar",
      venueName: event.venue || "Local a anunciar",
      address: event.city || "",
      ticketCount: tickets.length,
      downloadLink: `${appUrl}/my-tickets`,
      hasPdfAttachments: attachments.length > 0,
      ticketCode: tickets.length === 1 ? tickets[0].code : null,
    };

    const res = await sendTemplate({
      to: recipientEmail,
      templateId: "ticket-delivery",
      variables,
      idempotencyKey: `ticket-delivery-${orderId}`,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (!res.success) {
      safeLog.error("Failed to send ticket delivery email", { orderId, error: res.error, to: maskEmail(recipientEmail) });
    } else {
      safeLog.info("Ticket delivery email sent", {
        orderId,
        messageId: res.messageId,
        to: maskEmail(recipientEmail),
        attachmentCount: attachments.length,
      });
    }
  } catch (error: any) {
    safeLog.error("Error generating/sending ticket email", { orderId, error: error.message });
    throw error;
  }
}


/**
 * Generate ticket PDF
 * This is a placeholder - actual implementation should use a PDF library
 */
export async function generateTicketPDF(ticket: any): Promise<Buffer> {
  // Placeholder implementation
  // In production, use a PDF library like pdfkit or puppeteer
  const pdfContent = `Ticket ID: ${ticket.id}\nEvent: ${ticket.event?.title || "N/A"}\nAttendee: ${ticket.attendeeName || "N/A"}`;
  return Buffer.from(pdfContent, "utf-8");
}

/**
 * Get transporter (deprecated - kept for compatibility)
 * This function is deprecated as we use Resend now
 */
export function getTransporter(): null {
  console.warn("getTransporter() is deprecated - using Resend instead");
  return null;
}

/**
 * EmailService - Main export
 */
export const EmailService = {
  sendTemplate,
  enqueueTemplate,
  processTemplateSend,
  sendHtml,
};
