// lib/queue.ts
// DISABLED - No BullMQ for Vercel build
// CRITICAL: This file NEVER creates Queue instances, even if REDIS_URL is set

// Check if we're in build phase
const isBuildPhase = (): boolean => {
  if (typeof window !== 'undefined') return false; // Client-side
  
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-development-build' ||
    process.env.NEXT_PHASE === 'phase-export' ||
    (process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.REDIS_URL) ||
    process.env.VERCEL_ENV === undefined
  );
};

export const QUEUE_NAMES = {
  TICKET_PDF: "issue_ticket_pdf",
  TICKET_EMAIL: "send_ticket_email",
} as const;

export type Queue = any;
export type Worker = any;
export type Job = any;

export type QueueSystem = {
  queueTicketPdf: (ticketId: string) => Promise<string | null>;
  queueTicketEmail: (orderId: string, pdfs: Array<{ pdfBase64: string; filename: string }>) => Promise<string | null>;
  processTicketIssuance: (orderId: string) => Promise<void>;
};

// ALL FUNCTIONS RETURN NULL - NO QUEUE CREATION
export async function getEmailQueue(): Promise<any | null> {
  if (isBuildPhase()) return null;
  return null;
}

export async function getTicketQueue(): Promise<any | null> {
  if (isBuildPhase()) return null;
  return null;
}

export async function getTicketPdfQueue(): Promise<any | null> {
  if (isBuildPhase()) return null;
  return null;
}

export async function getTicketEmailQueue(): Promise<any | null> {
  if (isBuildPhase()) return null;
  return null;
}

export async function getNotificationQueue(): Promise<any | null> {
  if (isBuildPhase()) return null;
  return null;
}

export async function createWorker(
  queueName?: string,
  processor?: (job: any) => Promise<void>
): Promise<any | null> {
  if (isBuildPhase()) return null;
  return null;
}

export async function checkRedisConnection(): Promise<boolean> {
  if (isBuildPhase()) return false;
  return false;
}

export async function getQueue(): Promise<QueueSystem | null> {
  if (isBuildPhase()) return null;
  return null;
}

export async function initializeWorkers(): Promise<any> {
  if (isBuildPhase()) return null;
  return null;
}

export async function queueTicketPdf(ticketId?: string): Promise<string | null> {
  if (isBuildPhase()) return null;
  return null;
}

export async function queueTicketEmail(
  orderId?: string,
  pdfs?: Array<{ pdfBase64: string; filename: string }>
): Promise<string | null> {
  if (isBuildPhase()) return null;
  return null;
}

export async function processTicketIssuance(orderId?: string): Promise<void> {
  if (isBuildPhase()) return;
  return;
}
