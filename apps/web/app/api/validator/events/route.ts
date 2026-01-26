import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "USER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add ValidatorAssignment model to Prisma schema
    // const assignments = await prisma.validatorAssignment.findMany({
    //   where: { validatorUserId: session.user.id },
    //   include: {
    //     event: {
    //       select: {
    //         id: true,
    //         title: true,
    //         slug: true,
    //         startAt: true,
    //         endAt: true,
    //         city: true,
    //         checkinMode: true,
    //         maxEntries: true,
    //       },
    //     },
    //   },
    // });

    // const events = assignments.map((a) => a.event);

    return NextResponse.json([]); // Empty array until ValidatorAssignment model is added
  } catch (error) {
    console.error("Get validator events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
