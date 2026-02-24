import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { safeLog } from "@/lib/security";

export class FraudService {
    /**
     * Analyzes a check-in attempt for potential fraud.
     * If excessive failures are detected, it registers a FraudSignal.
     */
    static async analyzeCheckinAttempt(ticketId: string | null, rawHash: string, orderId?: string | null) {
        if (!ticketId) return;

        try {
            const recentFails = await prisma.checkinLog.count({
                where: {
                    ticketId,
                    result: { not: "VALID" },
                    scannedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } // last 15 mins
                }
            });

            if (recentFails >= 3) {
                await prisma.fraudSignal.create({
                    data: {
                        ticketId,
                        orderId: orderId || undefined,
                        type: "recursive_scan_failed",
                        severity: recentFails > 5 ? "high" : "medium",
                        score: Math.min(recentFails * 10, 100),
                        metadata: { hash: rawHash, recentFails },
                    }
                });

                safeLog.warn(`[AntiFraud] Multiple failed check-ins for ticket ${ticketId}`, {
                    ticketId, recentFails, hash: rawHash
                });
            }
        } catch (error) {
            safeLog.error("[AntiFraud] Error analyzing check-in attempt", error);
        }
    }

    /**
     * Analyzes when a perfectly valid ticket is scanned multiple times (double entry attempts).
     */
    static async analyzeDoubleEntryAttempt(ticketId: string, rawHash: string, orderId?: string | null) {
        try {
            const recentAttempts = await prisma.checkinLog.count({
                where: {
                    ticketId,
                    result: "ALREADY_USED",
                    scannedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // last 1 hour
                }
            });

            if (recentAttempts >= 2) {
                await prisma.fraudSignal.create({
                    data: {
                        ticketId,
                        orderId: orderId || undefined,
                        type: "repeated_double_entry",
                        severity: recentAttempts > 4 ? "high" : "medium",
                        score: Math.min(recentAttempts * 15, 100),
                        metadata: { hash: rawHash, recentAttempts },
                    }
                });

                safeLog.warn(`[AntiFraud] Repeated ALREADY_USED check-ins for ticket ${ticketId}`, {
                    ticketId, recentAttempts, hash: rawHash
                });
            }
        } catch (error) {
            safeLog.error("[AntiFraud] Error analyzing double entry attempt", error);
        }
    }
}
