import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { canManageBrandingSettings } from "@/lib/auth/member-permissions";
import { TicketTemplateService } from "@/lib/ticket-templates/ticket-template.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * GET /api/promotor/ticket-templates
 * List all templates for the promoter's organization
 */
export async function GET(req: NextRequest) {
    try {
        const { orgId, role, session } = await requirePromoter();
        const isGlobalAdmin = (session.user as { role?: string }).role === "ADMIN";

        if (!orgId) {
            return NextResponse.json({ error: "No organization context" }, { status: 403 });
        }

        const templates = await TicketTemplateService.listByOrg(orgId);
        return NextResponse.json(templates);
    } catch (error: any) {
        if (error.digest?.includes("NEXT_REDIRECT")) throw error;
        safeLog.error("Error listing ticket templates", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/promotor/ticket-templates
 * Create a new DRAFT template
 */
export async function POST(req: NextRequest) {
    try {
        const { orgId, role, session } = await requirePromoter();
        const isGlobalAdmin = (session.user as { role?: string }).role === "ADMIN";

        if (!orgId) {
            return NextResponse.json({ error: "No organization context" }, { status: 403 });
        }

        if (!isGlobalAdmin && !canManageBrandingSettings(role)) {
            return NextResponse.json({ error: "Sem permissão para editar templates." }, { status: 403 });
        }

        const body = await req.json();
        const { name, layout } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const template = await TicketTemplateService.createDraft(orgId, name, layout);
        return NextResponse.json(template, { status: 201 });
    } catch (error: any) {
        if (error.digest?.includes("NEXT_REDIRECT")) throw error;
        safeLog.error("Error creating ticket template", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
