import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/auth/guards";
import { RefundService } from "@/lib/finance";
import { z } from "zod";

const CancelSchema = z.object({
  reason: z.string().max(500).optional(),
  notifyBuyers: z.boolean().optional().default(true),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePromoter();
    const { id: eventId } = await params;
    const body = CancelSchema.parse(await req.json());

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, status: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }
    if (event.status === "CANCELLED") {
      return NextResponse.json({ error: "Evento já cancelado" }, { status: 400 });
    }

    const paidOrders = await prisma.order.findMany({
      where: { eventId, status: "PAID" },
      select: { id: true },
    });

    const refundResults: { orderId: string; ok: boolean; error?: string }[] = [];

    for (const order of paidOrders) {
      try {
        await RefundService.createRefund({
          orderId: order.id,
          reason: body.reason ?? `Cancelamento do evento: ${event.title}`,
        });
        refundResults.push({ orderId: order.id, ok: true });
      } catch (e) {
        refundResults.push({
          orderId: order.id,
          ok: false,
          error: e instanceof Error ? e.message : "Erro",
        });
      }
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: "CANCELLED" },
    });

    if (body.notifyBuyers) {
      const buyers = await prisma.order.findMany({
        where: { eventId, buyerEmail: { not: null } },
        select: { buyerEmail: true },
        distinct: ["buyerEmail"],
      });
      // Notificação básica via email transacional quando disponível
      for (const b of buyers) {
        if (!b.buyerEmail) continue;
      console.log(`[event-cancel] notify ${b.buyerEmail} about ${event.title}`);
      }
    }

    return NextResponse.json({
      success: true,
      refunded: refundResults.filter((r) => r.ok).length,
      failed: refundResults.filter((r) => !r.ok),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[event cancel]", error);
    return NextResponse.json({ error: "Erro ao cancelar evento" }, { status: 500 });
  }
}
