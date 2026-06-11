import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessFinanceAdmin } from "@/lib/finance/auth-guard";
import { FinancialEngine } from "@/lib/finance/financial-engine";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const ticketPriceEuros = Number(body.ticketPriceEuros ?? 20);
    const paymentMethodCode = String(body.paymentMethodCode ?? "MBWAY").toUpperCase();
    const organizationId = body.organizationId ? String(body.organizationId) : undefined;

    const result = await FinancialEngine.simulate({
      ticketPriceEuros,
      organizationId,
      paymentMethodCode,
    });

    return NextResponse.json(result);
  } catch (error) {
    safeLog.error("Finance simulator error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
