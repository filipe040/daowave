import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { TicketTemplateService } from "@/lib/ticket-templates/ticket-template.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * POST /api/promotor/ticket-templates/[id]/publish
 * Set a template as ACTIVE for the organization
 */
export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { orgId, userId } = await requirePromoter();
        const { id } = await props.params;

        // Verify ownership
        const template = await TicketTemplateService.getById(id);
        if (!template || template.organizationId !== orgId) {
            return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
        }

        const updated = await TicketTemplateService.publishTemplate(id, userId);

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.digest?.includes("NEXT_REDIRECT")) throw error;
        safeLog.error("Error publishing ticket template", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
