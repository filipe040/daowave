import { NextRequest, NextResponse } from "next/server";
import { InviteService } from "@/lib/services/invite.service";

/**
 * GET /api/invites/[token]
 * Public endpoint to check if an invite token is valid.
 */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const params = await context.params;
        const { valid, invite, error } = await InviteService.validateToken(params.token);

        if (!valid || !invite) {
            return NextResponse.json({ error: error || "Convite inválido" }, { status: 400 });
        }

        return NextResponse.json({
            id: invite.id,
            email: invite.email,
            role: invite.role,
            organization: {
                name: invite.organization.name,
                logoUrl: invite.organization.logoUrl,
            },
            expiresAt: invite.expiresAt,
        });
    } catch (error) {
        console.error("[Invite Validation GET]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
