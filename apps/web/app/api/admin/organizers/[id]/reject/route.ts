import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RejectSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

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
    const body = await req.json();
    const { reason } = RejectSchema.parse(body);

    const organizer = await prisma.organizerProfile.update({
      where: { id },
      data: {
        status: "REJECTED",
      },
    });

    return NextResponse.json({ success: true, organizer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error rejecting organizer:", error);
    return NextResponse.json(
      { error: "Failed to reject organizer" },
      { status: 500 }
    );
  }
}

