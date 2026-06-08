import { NextResponse } from "next/server";
import { safeLog } from "@/lib/security";
import { BalanceReleaseJob } from "@/lib/finance";

export const dynamic = "force-dynamic";

/** Cron: libertar saldos pendentes → disponíveis */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await BalanceReleaseJob.run();
    return NextResponse.json(result);
  } catch (error) {
    safeLog.error("Balance release job error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
