import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessFinanceAdmin } from "@/lib/finance/auth-guard";
import { safeLog } from "@/lib/security";
import { WithdrawalService } from "@/lib/finance";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PAID"]),
  rejectedReason: z.string().max(512).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    await WithdrawalService.updateStatus(id, body.status, {
      actorUserId: session.user.id,
      rejectedReason: body.rejectedReason,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    safeLog.error("Admin withdrawal update error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
