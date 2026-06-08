import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessFinanceAdmin } from "@/lib/finance/auth-guard";
import { safeLog } from "@/lib/security";
import { PaymentMethodService } from "@/lib/finance/payment-method.service";
import { FinancialAuditService } from "@/lib/finance/audit.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const methods = await PaymentMethodService.list(false);
    return NextResponse.json({ items: methods });
  } catch (error) {
    safeLog.error("Admin payment methods list error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body as {
      id: string;
      name?: string;
      fixedFee?: number;
      percentageFee?: number;
      vatPercentage?: number;
      active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    }

    const before = await PaymentMethodService.list(false).then((items) =>
      items.find((m) => m.id === id)
    );

    const updated = await PaymentMethodService.update(id, data);

    await FinancialAuditService.log({
      actorUserId: session.user.id,
      action: "PAYMENT_METHOD_UPDATED",
      entityType: "PaymentMethod",
      entityId: id,
      beforeJson: before as unknown as import("@prisma/client").Prisma.InputJsonValue,
      afterJson: updated as unknown as import("@prisma/client").Prisma.InputJsonValue,
    });

    return NextResponse.json(updated);
  } catch (error) {
    safeLog.error("Admin payment methods update error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
