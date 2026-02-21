import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createAuditLog } from "@/lib/audit";

const TransferSchema = z.object({
    recipientEmail: z.string().email("Email inválido"),
});

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const parsed = TransferSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Email inválido", details: parsed.error.errors },
                { status: 400 }
            );
        }

        const { recipientEmail } = parsed.data;

        // Verify ticket ownership
        const ticket = await prisma.ticket.findUnique({
            where: { id },
            include: { event: { select: { title: true, startAt: true } } },
        });

        if (!ticket) {
            return NextResponse.json({ error: "Bilhete não encontrado" }, { status: 404 });
        }

        if (ticket.userId !== session.user.id) {
            return NextResponse.json({ error: "Sem permissão para este bilhete" }, { status: 403 });
        }

        if (ticket.status === "USED") {
            return NextResponse.json({ error: "Não é possível transferir um bilhete já utilizado" }, { status: 400 });
        }

        if (ticket.status === "CANCELLED") {
            return NextResponse.json({ error: "Não é possível transferir um bilhete cancelado" }, { status: 400 });
        }

        // Cannot transfer to self
        if (recipientEmail === session.user.email) {
            return NextResponse.json({ error: "Não podes transferir para ti próprio" }, { status: 400 });
        }

        // Find recipient
        const recipient = await prisma.user.findUnique({
            where: { email: recipientEmail },
        });

        if (!recipient) {
            return NextResponse.json(
                { error: "Não encontrámos nenhum utilizador com esse email. O destinatário deve estar registado na plataforma." },
                { status: 404 }
            );
        }

        // Do the transfer
        const updated = await prisma.ticket.update({
            where: { id },
            data: { userId: recipient.id },
            select: { id: true, code: true, userId: true },
        });

        await createAuditLog({
            userId: session.user.id,
            action: "ticket.transfer",
            entityType: "ticket",
            entityId: id,
            details: {
                fromUserId: session.user.id,
                fromEmail: session.user.email,
                toUserId: recipient.id,
                toEmail: recipientEmail,
                eventTitle: ticket.event.title,
            },
        });

        console.log(`[ticket.transfer] ticket ${id} transferred from ${session.user.email} to ${recipientEmail}`);

        return NextResponse.json({
            ok: true,
            message: `Bilhete transferido com sucesso para ${recipientEmail}`,
            ticket: updated,
        });
    } catch (error) {
        console.error("Ticket transfer error", error);
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
}
