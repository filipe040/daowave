import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { AdminService } from "@/lib/services/admin";
import { OrganizationStatus } from "@prisma/client";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    if (!token || token.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const page = Number(req.nextUrl.searchParams.get("page")) || 1;
    const status = req.nextUrl.searchParams.get("status") as OrganizationStatus | undefined;

    try {
        const result = await AdminService.getOrganizations(page, 20, status);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
