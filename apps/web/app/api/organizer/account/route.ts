/**
 * @deprecated Use /api/promotor/account (canonical). This route is kept as legacy alias.
 * PUT /api/organizer/account - Update promoter account
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateAccountSchema = z.object({
  brandName: z.string().min(1, "Nome da marca é obrigatório"),
  userName: z.string().optional().nullable(),
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "PROMOTER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizerProfile = await prisma.promoterProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!organizerProfile) {
      return NextResponse.json(
        { error: "Organizer profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const data = UpdateAccountSchema.parse(body);

    // Update organizer profile
    await prisma.promoterProfile.update({
      where: { id: organizerProfile.id },
      data: {
        brandName: data.brandName,
      },
    });

    // Update user name if provided
    if (data.userName !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          name: data.userName || null,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

