import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { ManualSaleService } from "@/lib/services/manual-sale.service";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/promotor/manual-sales/[id]/void
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session } = await requirePromoter();
        const { id } = await params;

        await ManualSaleService.voidManualSale(
            id,
            (session.user as any).id
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PATCH Void Sale] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Erro ao anular venda" },
            { status: 500 }
        );
    }
}
