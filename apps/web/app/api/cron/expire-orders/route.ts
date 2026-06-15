import { NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/cron-auth";
import { expireStalePendingOrders } from "@/lib/checkout/expire-orders.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authError = verifyCronRequest(req);
  if (authError) return authError;

  try {
    const result = await expireStalePendingOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/expire-orders]", error);
    return NextResponse.json({ error: "Failed to expire orders" }, { status: 500 });
  }
}
