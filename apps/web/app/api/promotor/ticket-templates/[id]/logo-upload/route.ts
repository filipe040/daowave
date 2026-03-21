import { NextRequest, NextResponse } from "next/server";
import { requirePromoter } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];

/**
 * POST /api/promotor/ticket-templates/[id]/logo-upload
 * Upload a logo image for use in a ticket template
 */
export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { orgId } = await requirePromoter();
        const { id } = await props.params;

        // Verify ownership
        const template = await prisma.organizationTicketTemplate.findUnique({ where: { id } });
        if (!template || template.organizationId !== orgId) {
            return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Ficheiro não fornecido" }, { status: 400 });
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json({ error: "Tipo de ficheiro não permitido. Apenas PNG, JPG, WEBP, SVG" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "Ficheiro muito grande (máximo 5MB)" }, { status: 400 });
        }

        // Save to disk  
        const uploadsDir = join(process.cwd(), "public", "uploads", "ticket-templates", id);
        await mkdir(uploadsDir, { recursive: true });

        const timestamp = Date.now();
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const filename = `logo-${timestamp}.${ext}`;
        const filePath = join(uploadsDir, filename);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        const url = `/uploads/ticket-templates/${id}/${filename}`;

        return NextResponse.json({ url }, { status: 201 });
    } catch (error: any) {
        if (error.digest?.includes("NEXT_REDIRECT")) throw error;
        safeLog.error("Error uploading template logo", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
