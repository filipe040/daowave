import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const organizer = await prisma.organizerProfile.update({
      where: { id },
      data: {
        status: "APPROVED",
      },
    });

    return NextResponse.json({ success: true, organizer });
  } catch (error) {
    console.error("Error approving organizer:", error);
    return NextResponse.json(
      { error: "Failed to approve organizer" },
      { status: 500 }
    );
  }
}

