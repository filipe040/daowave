import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog } from "@/lib/security";
import { RefundService } from "@/lib/finance";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createRefundSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().max(512).optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    const result = await RefundService.list({ page, limit });
    return NextResponse.json(result);
  } catch (error) {
    safeLog.error("Admin refunds list error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = createRefundSchema.parse(await req.json());
    const result = await RefundService.createRefund({
      orderId: body.orderId,
      reason: body.reason,
      initiatedByUserId: session.user.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    safeLog.error("Admin refund create error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
