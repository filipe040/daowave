import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/services/inventory.service";
import { safeLog } from "@/lib/security";

// This endpoint should be triggered by Vercel Cron or an external ping service
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    // Verify cron secret for security (e.g. from Vercel)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const start = Date.now();
        const result = await InventoryService.releaseExpiredHolds();
        const duration = Date.now() - start;

        if (result.releasedInventoryHolds > 0 || result.releasedSeatHolds > 0) {
            safeLog.info("Scheduled job released expired holds", { ...result, durationMs: duration });
        }

        return NextResponse.json({
            success: true,
            message: "Expired holds released",
            data: result,
            durationMs: duration
        });
    } catch (error: any) {
        safeLog.error("Error running release-holds cron", error);
        return NextResponse.json(
            { error: "Internal server error", message: error.message },
            { status: 500 }
        );
    }
}
