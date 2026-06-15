import { NextResponse } from "next/server";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import { CheckinService } from "@/lib/services/checkin.service";
import { getPromoterContext } from "@/lib/auth/guards";
import { canCheckIn } from "@/lib/auth/member-permissions";

export async function POST(req: Request) {
  try {
    const rateLimitResponse = await applyRateLimit(req, RATE_LIMITS.validatorCheckin);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const ctx = await getPromoterContext();
    if (!ctx) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", resultType: "unauthorized" },
        { status: 401 }
      );
    }

    if (!canCheckIn(ctx.role) && ctx.globalRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Sem permissão para check-in", resultType: "forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { token, deviceId = "UNKNOWN", eventId } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token required", resultType: "invalid_input" },
        { status: 400 }
      );
    }

    const result = await CheckinService.validate(token, eventId, deviceId, ctx.userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Check-in API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", resultType: "server_error" },
      { status: 500 }
    );
  }
}
