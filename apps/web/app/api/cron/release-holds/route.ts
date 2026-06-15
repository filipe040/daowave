import { NextResponse } from "next/server";
import { InventoryService } from "@/lib/services/inventory.service";
import { safeLog } from "@/lib/security";
import { verifyCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const authError = verifyCronRequest(req);
    if (authError) return authError;

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
