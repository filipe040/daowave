import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { AdminService } from "@/lib/services/admin";
import { OrganizationStatus } from "@prisma/client";
import { NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
    status: z.nativeEnum(OrganizationStatus)
});

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const token = await getToken({ req });
    if (!token || token.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    try {
        const json = await req.json();
        const { status } = bodySchema.parse(json);

        const result = await AdminService.updateOrganizationStatus(params.id, status);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }
}
