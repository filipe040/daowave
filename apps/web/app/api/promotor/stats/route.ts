import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { AnalyticsService } from "@/lib/services/analytics";
import { OrganizationService } from "@/lib/services/organization";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req });
        if (!token || !token.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get selected organization from header or query, default to first user org
        let orgId = req.nextUrl.searchParams.get("orgId");

        if (!orgId) {
            const userOrgs = await OrganizationService.getUserOrganizations(token.id as string);
            if (userOrgs.length > 0) {
                orgId = userOrgs[0].id;
            } else {
                // No organization yet
                return NextResponse.json({
                    empty: true,
                    message: "No organization found"
                });
            }
        }

        // TODO: Verify user is member of orgId (OrganizationService.isMember...)

        const [stats, chart] = await Promise.all([
            AnalyticsService.getPromoterStats(orgId),
            AnalyticsService.getSalesChart(orgId)
        ]);

        return NextResponse.json({ ...stats, chart });

    } catch (error) {
        console.error("[Promoter Stats] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
