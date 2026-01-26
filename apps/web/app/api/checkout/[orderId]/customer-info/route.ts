import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CustomerInfoSchema = z.object({
  buyerName: z.string().min(1, "Nome é obrigatório"),
  buyerEmail: z.string().email("Email inválido"),
  buyerPhone: z.string().min(1, "Número de telemóvel é obrigatório"),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await req.json();
    const data = CustomerInfoSchema.parse(body);

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order cannot be modified" },
        { status: 400 }
      );
    }

    // Update order with buyer information
    // Using raw SQL temporarily until Prisma Client is regenerated after server restart
    await prisma.$executeRaw`
      UPDATE "Order"
      SET "buyerName" = ${data.buyerName},
          "buyerEmail" = ${data.buyerEmail},
          "buyerPhone" = ${data.buyerPhone}
      WHERE id = ${orderId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Update customer info error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

