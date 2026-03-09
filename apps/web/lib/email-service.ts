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
import { getEmailQueue } from "./queue/email.queue";

export type EmailTemplate =
  | "verify-email"
  | "reset-password"
  | "order-confirmed"
  | "ticket-delivery"
  | "ticket-transfer"
  | "invite-organization"
  | "event-reminder-24h"
  | "post-event-thankyou"
  | "promoter-daily-report";

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
 * Check idempotency - prevent duplicate emails
 */
async function checkIdempotency(
  idempotencyKey: string,
  template: EmailTemplate,
  to: string
): Promise<{ isDuplicate: boolean; existingLogId?: string }> {
  if (!idempotencyKey) {
    return { isDuplicate: false };
  }

  // For MySQL/MariaDB, JSON queries are different - use raw query or skip idempotency check
  // For now, skip idempotency check if EmailLog doesn't exist or JSON query fails
  let existing = null;
  try {
    // Try to find existing email log
    // Note: MySQL JSON path syntax is different, so we'll check by template and to only
    existing = await prisma.emailLog.findFirst({
      where: {
        status: "SENT",
        template,
        to: to.toLowerCase().trim(),
        // For MySQL, we can't easily query JSON path, so we'll rely on template + to + status
        // This is less strict but works without complex JSON queries
      },
      orderBy: { createdAt: "desc" },
    });

    // If found, check if idempotencyKey matches (if meta exists)
    if (existing && existing.meta && typeof existing.meta === 'object' && 'idempotencyKey' in existing.meta) {
      if ((existing.meta as any).idempotencyKey === idempotencyKey) {
        // Match found
      } else {
        // Different idempotency key, not a duplicate
        existing = null;
      }
    } else if (existing) {
      // Found existing but no idempotencyKey in meta, treat as potential duplicate
      // (conservative approach - prevent sending if recent email exists)
    }
  } catch (error: any) {
    // If EmailLog table doesn't exist or query fails, skip idempotency check
    safeLog.warn("EmailLog query failed, skipping idempotency check", { error: error.message });
  }

  return {
    isDuplicate: !!existing,
    existingLogId: existing?.id,
  };
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
 * Send email using template (Backward compatibility wrapper)
 */
export async function sendTemplate(options: SendTemplateOptions): Promise<SendEmailResult> {
  const result = await enqueueTemplate(options);
  return {
    success: result.success,
    emailLogId: result.jobId || "placeholder",
    error: result.success ? undefined : result.message,
  };
}

/**
 * Process the actual raw sending (Worker calls this)
 */
export async function processTemplateSend(
  to: string,
  templateId: string,
  variables: any,
  jobLogId?: string,
  attachments?: any[]
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
    default:
      throw new Error(`Unknown template: ${templateId}`);
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
 * Send login notification email
 */
export async function sendLoginNotificationEmail(
  to: string,
  name: string,
  loginInfo: { ip: string; userAgent: string | null; timestamp: Date }
): Promise<void> {
  await EmailService.sendHtml({
    to,
    subject: "Novo acesso à sua conta",
    html: `
      <h2>Olá ${name},</h2>
      <p>Detetámos um novo acesso à sua conta:</p>
      <ul>
        <li><strong>Data/Hora:</strong> ${loginInfo.timestamp.toLocaleString("pt-PT")}</li>
        <li><strong>IP:</strong> ${loginInfo.ip}</li>
        <li><strong>Navegador:</strong> ${loginInfo.userAgent || "Desconhecido"}</li>
      </ul>
      <p>Se não foi você, por favor altere a sua palavra-passe imediatamente.</p>
    `,
    idempotencyKey: `login-notification-${to}-${loginInfo.timestamp.getTime()}`,
  });
}

export async function sendTicketsEmail(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        event: {
          include: {
            organization: true,
          }
        },
        user: true,
        tickets: true,
      }
    });

    if (!order || !order.user || !order.event) {
      safeLog.error("Missing data for ticket email", { orderId });
      return;
    }

    const { user, event, tickets } = order;

    // Build variables
    const variables = {
      name: user.name || "Cliente",
      eventTitle: event.title,
      eventDate: event.startAt ? new Date(event.startAt).toLocaleString("pt-PT") : "Data a anunciar",
      venueName: event.venue || "Local a anunciar",
      address: event.city || "",
      ticketCount: tickets.length,
      downloadLink: `${process.env.NEXT_PUBLIC_APP_URL || "https://7eventickets.pt"}/my-tickets`, // Updated to generic tickets page.
    };

    const res = await sendTemplate({
      to: user.email,
      templateId: "ticket-delivery",
      variables,
      idempotencyKey: `ticket-delivery-${orderId}`
    });

    if (!res.success) {
      safeLog.error("Failed to send ticket delivery email", { orderId, error: res.error });
    } else {
      safeLog.info("Ticket delivery email sent", { orderId, messageId: res.messageId });
    }
  } catch (error: any) {
    safeLog.error("Error generating/sending ticket email", { orderId, error: error.message });
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
