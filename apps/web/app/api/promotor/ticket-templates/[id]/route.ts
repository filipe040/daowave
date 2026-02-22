import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { TicketTemplateService } from "@/lib/ticket-templates/ticket-template.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/promotor/ticket-templates/[id]
 */
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { orgId } = await requirePromoter();
        const { id } = await props.params;

        const template = await TicketTemplateService.getById(id);
        if (!template || template.organizationId !== orgId) {
            return NextResponse.json({ error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json(template);
    } catch (error: any) {
        if (error.digest?.includes("NEXT_REDIRECT")) throw error;
        safeLog.error("Error fetching ticket template", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PATCH /api/promotor/ticket-templates/[id]
 * Update a ticket template
 */
export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { orgId } = await requirePromoter();
        const { id } = await props.params;

        // Verify ownership
        const template = await TicketTemplateService.getById(id);
        if (!template || template.organizationId !== orgId) {
            return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
        }

        const body = await req.json();
        const updated = await TicketTemplateService.updateTemplate(id, body);

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.digest?.includes("NEXT_REDIRECT")) throw error;
        if (error.name === "ZodError") {
            return NextResponse.json({ error: "Invalid theme configuration", details: error.errors }, { status: 400 });
        }
        safeLog.error("Error updating ticket template", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/promotor/ticket-templates/[id]
 * Archive a ticket template
 */
export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { orgId } = await requirePromoter();
        const { id } = await props.params;

        // Verify ownership
        const template = await TicketTemplateService.getById(id);
        if (!template || template.organizationId !== orgId) {
            return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
        }

        const updated = await TicketTemplateService.archiveTemplate(id);
        return NextResponse.json({ success: true, status: updated.status });
    } catch (error: any) {
        if (error.digest?.includes("NEXT_REDIRECT")) throw error;
        safeLog.error("Error deleting ticket template", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
