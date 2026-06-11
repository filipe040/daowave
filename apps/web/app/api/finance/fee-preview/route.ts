import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FinancialEngine } from "@/lib/finance/financial-engine";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const priceCents = Math.round(Number(searchParams.get("priceCents") ?? 0));
    const organizationId = searchParams.get("organizationId") ?? undefined;

    if (priceCents <= 0) {
      return NextResponse.json({ error: "priceCents inválido" }, { status: 400 });
    }

    const split = await FinancialEngine.calculateOrderSplit({
      ticketPriceCents: priceCents,
      organizationId,
    });

    const fmt = (c: number) => `${(c / 100).toFixed(2)}€`;

    return NextResponse.json({
      ticketPriceCents: priceCents,
      serviceFeeCents: split.serviceFeeCents,
      totalCustomerCents: split.totalCustomerCents,
      promoterReceivesCents: split.promoterNetCents,
      feePaidBy: split.feePaidBy,
      breakdown: {
        precoBase: fmt(priceCents),
        taxaServico: fmt(split.serviceFeeCents),
        totalCliente: fmt(split.totalCustomerCents),
        recebes: fmt(split.promoterNetCents),
      },
    });
  } catch (error) {
    safeLog.error("Fee preview error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
