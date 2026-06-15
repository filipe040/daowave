import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdminSupport } from "@/lib/auth/admin-access";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["NEW", "READ", "REPLIED", "ARCHIVED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !canAccessAdminSupport(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = patchSchema.parse(await req.json());

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({ message: updated });
}
