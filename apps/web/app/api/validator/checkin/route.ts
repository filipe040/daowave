import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import { CheckinService } from "@/lib/services/checkin.service";

export async function POST(req: Request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(req, RATE_LIMITS.validatorCheckin);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "USER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized", resultType: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { token, deviceId = "UNKNOWN", eventId } = body;

    if (!token) {
      return NextResponse.json({ success: false, message: "Token required", resultType: "invalid_input" }, { status: 400 });
    }

    // Hand over off business logic processing to CheckinService
    const result = await CheckinService.validate(
      token,
      eventId,
      deviceId,
      session.user.id
    );

    // Return standardized <200ms payload shape
    return NextResponse.json(result);
  } catch (error) {
    console.error("Check-in API error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", resultType: "server_error" },
      { status: 500 }
    );
  }
}
