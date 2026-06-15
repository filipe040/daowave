import { NextResponse } from "next/server";
import { TicketAlertService } from "@/lib/services/ticket-alert.service";
import { safeLog } from "@/lib/security";
import { verifyCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const authError = verifyCronRequest(request);
  if (authError) return authError;

  try {
    const result = await TicketAlertService.processScheduledAlerts();
    safeLog.info("ticket_alerts cron completed", result);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    safeLog.error("ticket_alerts cron error", { error: message });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
