import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TicketAlertService } from "@/lib/services/ticket-alert.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().max(128).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const event = await prisma.event.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: { id: true, presaveEnabled: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    const status = await TicketAlertService.getPresaveStatus(event.id);
    const pendingCount = await TicketAlertService.countPending(event.id);

    return NextResponse.json({ ...status, pendingCount });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = subscribeSchema.parse(await req.json());

    const event = await prisma.event.findUnique({
      where: { slug, status: "PUBLISHED" },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const alert = await TicketAlertService.subscribe({
      eventId: event.id,
      email: body.email,
      name: body.name,
      userId,
    });

    return NextResponse.json({
      success: true,
      message: "Registámos o seu email. Avisamos assim que os bilhetes estiverem à venda.",
      id: alert.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || "Dados inválidos" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erro interno";
    const status = message.includes("já estão disponíveis") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
