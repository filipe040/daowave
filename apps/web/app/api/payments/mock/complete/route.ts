import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTicketsEmail } from "@/lib/email-service";
import { z } from "zod";

const CompleteMockPaymentSchema = z.object({
  orderId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId } = CompleteMockPaymentSchema.parse(body);

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ message: "Order already paid" });
    }

    // Update order to PAID
    await prisma.$transaction(async (tx) => {
      // Update order
      await (tx.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        } as any,
      }) as Promise<any>);

      // Create tickets
      for (const item of order.items as any[]) {
        const ticketLot = item.ticketLot as any;
        for (let i = 0; i < item.qty; i++) {
          // Generate unique nonce for QR
          const qrNonce = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

          // Use session user info for buyer
          const buyerName = session.user.name || "Attendee";
          const buyerEmail = session.user.email || "";
          
          await (tx.ticket.create({
            data: {
              eventId: order.eventId,
              orderId: order.id,
              ticketTypeId: ticketLot.ticketType.id,
              ticketLotId: item.ticketLotId,
              status: "ISSUED",
              holderUserId: session.user.id,
              attendeeName: buyerName,
              attendeeEmail: buyerEmail,
              qrNonce,
              entriesUsed: 0,
            } as any,
          }) as Promise<any>);
        }

        // Update stock
        await tx.ticketLot.update({
          where: { id: item.ticketLotId },
          data: {
            quantitySold: {
              increment: item.qty,
            },
          },
        });
      }
    });

    console.log("✅ Mock payment completed for order:", orderId);
    
    // Fetch order again to get user info
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    const recipientEmail = updatedOrder?.user.email;
    console.log(`📧 Email será enviado para: ${recipientEmail || "N/A"}`);
    
    // Send email with tickets (don't await to avoid blocking response)
    sendTicketsEmail(orderId).catch((error) => {
      console.error("❌ Failed to send tickets email:", error);
      // Don't throw - email failure shouldn't break the payment flow
    });

    return NextResponse.json({ 
      success: true,
      message: "Mock payment completed successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Mock payment completion error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return NextResponse.json(
      { 
        error: "Failed to complete mock payment",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

