import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextRequest } from "next/server";

// Secret for HMAC signing (should be env var but using nextauth secret fallback)
const QR_SECRET = process.env.QR_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

export async function POST(req: NextRequest) {
    const token = await getToken({ req });
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { ticketId } = await req.json();

        // 1. Get Ticket Info
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { event: true, user: true }
        });

        if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

        // 2. Generate Payload
        // Format: v1:ticketId:eventId:timestamp
        const timestamp = Date.now();
        const payloadStart = `v1:${ticket.id}:${ticket.eventId}:${timestamp}`;

        // 3. Sign Payload
        const signature = crypto
            .createHmac("sha256", QR_SECRET)
            .update(payloadStart)
            .digest("hex");

        const fullPayload = `${payloadStart}:${signature}`;

        // 4. Update Ticket with new payload (optional, or just return it)
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { qrPayload: fullPayload }
        });

        return NextResponse.json({ payload: fullPayload });

    } catch (error) {
        console.error("[QR Sign] Error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
