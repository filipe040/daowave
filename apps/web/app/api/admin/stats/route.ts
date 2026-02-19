import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { AdminService } from "@/lib/services/admin";
import { NextRequest } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const token = await getToken({ req });

    // Explicit Admin Check (Middleware handles it, but double check good practice)
    if (!token || token.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const stats = await AdminService.getPlatformStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error("[Admin Stats] Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
