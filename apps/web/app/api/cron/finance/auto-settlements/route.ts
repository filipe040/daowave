import { NextResponse } from "next/server";
import { AutoSettlementService } from "@/lib/finance/auto-settlement.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;
    if (!process.env.CRON_SECRET || authHeader !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await AutoSettlementService.run();
    return NextResponse.json(result);
  } catch (error) {
    safeLog.error("Auto settlements cron error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
