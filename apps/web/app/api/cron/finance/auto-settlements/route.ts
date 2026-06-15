import { NextResponse } from "next/server";
import { AutoSettlementService } from "@/lib/finance/auto-settlement.service";
import { safeLog } from "@/lib/security";
import { verifyCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

async function runJob() {
  const result = await AutoSettlementService.run();
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;
  try {
    return await runJob();
  } catch (error) {
    safeLog.error("Auto settlements cron error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;
  try {
    return await runJob();
  } catch (error) {
    safeLog.error("Auto settlements cron error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
