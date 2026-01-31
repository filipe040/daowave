import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getRequestMetadata } from "@/lib/security";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const organizer = await prisma.promoterProfile.update({
      where: { id },
      data: {
        status: "APPROVED",
      },
    });

    const metadata = getRequestMetadata(req);
    await createAuditLog({
      userId: session.user.id,
      action: "ADMIN_PROMOTER_APPROVED",
      entityType: "promoter",
      entityId: id,
      details: { brandName: organizer.brandName },
      ipAddress: metadata.ip,
      userAgent: metadata.userAgent,
    });

    return NextResponse.json({ success: true, organizer });
  } catch (error) {
    console.error("Error approving promoter:", error);
    return NextResponse.json(
      { error: "Failed to approve organizer" },
      { status: 500 }
    );
  }
}

