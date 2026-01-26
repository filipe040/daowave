/**
 * Email Provider Service
 * Supports Resend and SendGrid with unified interface
 */

import { config } from "./config";
import { env } from "./env.server";

export type EmailProvider = "resend" | "sendgrid" | "smtp";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get configured email provider
 */
export function getEmailProvider(): EmailProvider {
  if (env.EMAIL_PROVIDER_KEY) {
    // Check if it's Resend (starts with re_) or SendGrid (starts with SG.)
    if (env.EMAIL_PROVIDER_KEY.startsWith("re_")) {
      return "resend";
    }
    if (env.EMAIL_PROVIDER_KEY.startsWith("SG.")) {
      return "sendgrid";
    }
  }
  
  // Fallback to SMTP if SMTP is configured
  if (env.SMTP_USER && env.SMTP_PASS) {
    return "smtp";
  }
  
  return "smtp"; // Default
}

/**
 * Send email via Resend
 */
async function sendViaResend(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    // Dynamic import to avoid requiring resend if not used
    const resendModule = await import("resend");
    const Resend = resendModule.Resend;
    if (!Resend) {
      throw new Error("Resend class not found in module");
    }
    const client = new Resend(env.EMAIL_PROVIDER_KEY);

    const fromEmail = options.from || env.EMAIL_FROM || `bilhetes@${config.app.url?.replace(/^https?:\/\//, "").split("/")[0] || "7eventickets.pt"}`;

    const result = await client.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content instanceof Buffer ? att.content.toString("base64") : att.content,
        contentType: att.contentType,
      })),
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "Unknown Resend error",
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to send via Resend",
    };
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    // Dynamic import - @sendgrid/mail is now installed as optional dependency
    // @sendgrid/mail exports MailService as default
    // Using require to avoid TypeScript type checking issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sgMail = require("@sendgrid/mail") as any;
    if (!sgMail || typeof sgMail.setApiKey !== "function") {
      return {
        success: false,
        error: "SendGrid module not properly loaded",
      };
    }
    sgMail.setApiKey(env.EMAIL_PROVIDER_KEY!);

    const fromEmail = options.from || env.EMAIL_FROM || `bilhetes@${config.app.url?.replace(/^https?:\/\//, "").split("/")[0] || "7eventickets.pt"}`;

    const msg: any = {
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      html: options.html,
    };

    if (options.attachments && options.attachments.length > 0) {
      msg.attachments = options.attachments.map((att) => ({
        content: att.content instanceof Buffer ? att.content.toString("base64") : att.content,
        filename: att.filename,
        type: att.contentType,
        disposition: "attachment",
      }));
    }

    const [response] = await sgMail.send(msg);

    return {
      success: response.statusCode >= 200 && response.statusCode < 300,
      messageId: response.headers["x-message-id"] as string | undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to send via SendGrid",
    };
  }
}

/**
 * Send email via SMTP (nodemailer)
 */
async function sendViaSMTP(options: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const nodemailer = await import("nodemailer");
    
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(env.SMTP_PORT || "587"),
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    const fromEmail = options.from || env.SMTP_USER || `bilhetes@${config.app.url?.replace(/^https?:\/\//, "").split("/")[0] || "7eventickets.pt"}`;

    const info = await transporter.sendMail({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content instanceof Buffer ? att.content : Buffer.from(att.content),
        contentType: att.contentType,
      })),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to send via SMTP",
    };
  }
}

/**
 * Unified email sending function
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const provider = getEmailProvider();

  switch (provider) {
    case "resend":
      return sendViaResend(options);
    case "sendgrid":
      return sendViaSendGrid(options);
    case "smtp":
    default:
      return sendViaSMTP(options);
  }
}

/**
 * Check if email provider is configured
 */
export function isEmailProviderConfigured(): boolean {
  return Boolean(
    env.EMAIL_PROVIDER_KEY ||
    (env.SMTP_USER && env.SMTP_PASS)
  );
}

