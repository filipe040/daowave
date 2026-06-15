import { NextResponse } from "next/server";
import { SeatMapService } from "@/lib/services/seat-map.service";
import { requirePromoter } from "@/lib/auth/guards";
import { canManageTicketContent } from "@/lib/auth/member-permissions";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { session, role } = await requirePromoter();
        const canManage = canManageTicketContent(role) || (session.user as any).role === "ADMIN";

        if (!canManage) {
            return NextResponse.json({ error: "Permissões insuficientes para importar mapas de lugares." }, { status: 403 });
        }

        const { id: eventId } = await params;
        const formData = await req.formData();

        const file = formData.get("file") as File;
        if (!file) {
            return NextResponse.json({ error: "Ficheiro CSV não encontrado." }, { status: 400 });
        }

        const mapName = (formData.get("name") as string) || "Mapa de Lugares";
        const textContent = await file.text();

        const result = await SeatMapService.importFromCsv(eventId, mapName, textContent);



        return NextResponse.json({ success: true, seatMap: result.seatMap, totalSeats: result.totalSeats });
    } catch (error: any) {
        console.error("[seat-maps] POST error:", error);
        return NextResponse.json(
            { error: error.message || "Erro ao importar mapa de lugares." },
            { status: error.message.includes("inválido") || error.message.includes("Linha") ? 400 : 500 }
        );
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requirePromoter();
        const { id: eventId } = await params;

        const stats = await SeatMapService.getStats(eventId);
        return NextResponse.json({ stats });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}
