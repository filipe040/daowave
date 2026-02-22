import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { ManualSaleService } from "@/lib/services/manual-sale.service";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/promotor/manual-sales/[id]/mark-paid
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session } = await requirePromoter();
        const { id } = await params;

        const result = await ManualSaleService.markManualSalePaid(
            id,
            (session.user as any).id
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("[PATCH Mark Paid] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Erro ao atualizar venda" },
            { status: 500 }
        );
    }
}
