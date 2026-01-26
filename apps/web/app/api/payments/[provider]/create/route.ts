import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments/provider";
import { z } from "zod";

const CreatePaymentSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await params;
    const body = await req.json();
    const { orderId } = CreatePaymentSchema.parse(body);

    // Verify order belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: session.user.id },
      include: {
        event: true,
        items: {
          include: {
            ticketLot: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Order is not pending" },
        { status: 400 }
      );
    }

    // Get payment provider
    const paymentProvider = getPaymentProvider(provider.toUpperCase() as "MBWAY" | "MULTIBANCO" | "PAYPAL");
    
    const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const paymentResponse = await paymentProvider.createPayment({
      orderId: order.id,
      amount: order.totalCents,
      currency: order.currency,
      returnUrl: `${baseUrl}/orders/${order.id}/success`,
      cancelUrl: `${baseUrl}/orders/${order.id}/cancel`,
      metadata: {
        orderId: order.id,
        eventId: order.eventId,
        userId: session.user.id,
      },
    });

    // Update order with payment provider and reference
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentProvider: provider.toUpperCase() as "MBWAY" | "MULTIBANCO" | "PAYPAL",
        paymentRef: paymentResponse.paymentId,
      },
    });

    return NextResponse.json(paymentResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
