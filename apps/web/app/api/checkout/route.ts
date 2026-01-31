/**
 * Legacy POST /api/checkout — deprecated.
 * Use POST /api/checkout/create (step 1) then POST /api/checkout/[orderId]/confirm (step 2).
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Use POST /api/checkout/create to create order, then POST /api/checkout/[orderId]/confirm with buyerName, buyerEmail to confirm.",
    },
    { status: 410 }
  );
}
