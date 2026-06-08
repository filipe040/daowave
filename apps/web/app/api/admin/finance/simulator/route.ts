import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessFinanceAdmin } from "@/lib/finance/auth-guard";
import { safeLog } from "@/lib/security";
import {
  FinancialSettingsService,
  PaymentMethodService,
  simulateFinancialScenario,
} from "@/lib/finance";

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
    const commissionPercent = body.commissionPercent != null ? Number(body.commissionPercent) : undefined;

    const [settings, paymentMethod] = await Promise.all([
      FinancialSettingsService.get(),
      PaymentMethodService.getByCode(paymentMethodCode),
    ]);

    const overrideSettings = {
      serviceFeeType: settings.serviceFeeType,
      serviceFeeValue:
        body.serviceFeeValue != null ? Number(body.serviceFeeValue) : settings.serviceFeeValue,
      reservePercentage:
        body.reservePercentage != null ? Number(body.reservePercentage) : settings.reserveFundPercent,
      dynamicServiceFee:
        body.dynamicServiceFee != null ? Boolean(body.dynamicServiceFee) : settings.dynamicServiceFee,
      minimumProfitPerOrderCents:
        body.minimumProfitPerOrderCents != null
          ? Math.round(Number(body.minimumProfitPerOrderCents) * 100)
          : settings.minimumProfitPerOrderCents,
      defaultVatPercent:
        body.vatPercent != null ? Number(body.vatPercent) : settings.defaultVatPercent,
    };

    const result = simulateFinancialScenario({
      ticketPriceEuros,
      paymentMethodCode,
      paymentMethod,
      settings: overrideSettings,
      commissionPercent,
    });

    return NextResponse.json(result);
  } catch (error) {
    safeLog.error("Finance simulator error", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
