import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextRequest } from "next/server";

const QR_SECRET = process.env.QR_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret";

export async function POST(req: NextRequest) {
    const token = await getToken({ req });
    // Allow STAFF, VALIDATOR, ADMIN, PROMOTER
    // TODO: Rbac check "scan:tickets"

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { qrPayload, deviceId } = await req.json();

        // 1. Validate Signature
        const parts = qrPayload.split(":");
        if (parts.length !== 5) return NextResponse.json({ error: "Invalid QR Format", result: "INVALID" }, { status: 400 });

        const [version, ticketId, eventId, timestamp, signature] = parts;
        const payloadStart = `${version}:${ticketId}:${eventId}:${timestamp}`;

        const expectedSignature = crypto
            .createHmac("sha256", QR_SECRET)
            .update(payloadStart)
            .digest("hex");

        if (signature !== expectedSignature) {
            return NextResponse.json({ error: "Invalid Signature", result: "INVALID" }, { status: 400 });
        }

        // 2. Check Ticket Status in DB
        const ticket = await prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { user: true, ticketLot: true }
        });

        if (!ticket) return NextResponse.json({ error: "Ticket not found", result: "INVALID" }, { status: 404 });

        // 3. Idempotency / Double Scan Check
        if (ticket.status === 'USED') {
            const lastLog = await prisma.checkinLog.findFirst({
                where: { ticketId: ticket.id, result: 'SUCCESS' },
                orderBy: { scannedAt: 'desc' }
            });

            return NextResponse.json({
                valid: false,
                result: "ALREADY_USED",
                message: "Bilhete já utilizado",
                ticket: {
                    holder: ticket.user.name,
                    type: ticket.ticketLot.name,
                    checkedInAt: ticket.checkedInAt,
                    lastScannedBy: lastLog?.validatorUserId
                }
            });
        }

        if (ticket.status !== 'VALID') {
            return NextResponse.json({
                valid: false,
                result: "INVALID",
                message: `Bilhete inválido (Status: ${ticket.status})`
            });
        }

        // 4. Mark as USED and Log
        await prisma.$transaction([
            prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'USED',
                    checkedInAt: new Date(),
                    checkedInByUserId: token.id as string
                }
            }),
            prisma.checkinLog.create({
                data: {
                    ticketId,
                    eventId,
                    validatorUserId: token.id as string,
                    deviceId: deviceId || 'unknown',
                    result: 'SUCCESS',
                    rawPayloadHash: crypto.createHash('md5').update(qrPayload).digest('hex'),
                    offline: false
                }
            })
        ]);

        return NextResponse.json({
            valid: true,
            result: "SUCCESS",
            message: "Entrada validada!",
            ticket: {
                holder: ticket.user.name,
                type: ticket.ticketLot.name
            }
        });

    } catch (error) {
        console.error("[Check-in Scan] Error:", error);
        return NextResponse.json({ error: "Internal Error", result: "ERROR" }, { status: 500 });
    }
}
