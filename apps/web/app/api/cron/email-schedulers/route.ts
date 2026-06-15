import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { enqueueTemplate } from "../../../../lib/email-service";
import { TicketAlertService } from "../../../../lib/services/ticket-alert.service";
import { safeLog } from "../../../../lib/security";
import { verifyCronRequest } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
    const authError = verifyCronRequest(request);
    if (authError) return authError;

    try {
        const results = {
            reminders: 0,
            thankYous: 0,
            reports: 0,
            ticketAlerts: 0,
        };

        const now = new Date();

        // 1. EVENT REMINDERS (Events starting within 24 to 48 hours)
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const upcomingEvents = await prisma.event.findMany({
            where: {
                startAt: {
                    gte: in24h,
                    lte: in48h,
                },
                status: "PUBLISHED"
            },
            include: {
                tickets: {
                    include: {
                        order: {
                            include: { user: true }
                        }
                    }
                },
                organization: true
            }
        });

        for (const event of upcomingEvents) {
            // Get unique users who have PAID tickets
            const usersToRemind = new Map<string, any>();
            event.tickets.forEach((t: any) => {
                if (t.order.status === "PAID" && t.order.user) {
                    usersToRemind.set(t.order.user.id, t.order.user);
                }
            });

            for (const [userId, user] of usersToRemind.entries()) {
                const idempotencyKey = `event-reminder-24h-${event.id}-${userId}`;

                const result = await enqueueTemplate({
                    to: user.email,
                    templateId: "event-reminder-24h",
                    idempotencyKey,
                    variables: {
                        name: user.name || "Cliente",
                        eventTitle: event.title,
                        eventDate: event.startAt.toLocaleString('pt-PT'),
                        venueName: event.venue, // Could be split further based on your model
                        address: event.city,
                        ticketUrl: `https://tickets.daowave.pt/ticket/${event.tickets.find((t: any) => t.order.userId === userId)?.id}`,
                    }
                });

                if (result.success && result.message === "Queued") {
                    results.reminders++;
                }
            }
        }

        // 2. POST-EVENT THANK YOUS (Events ended in the last 24h)
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const pastEvents = await prisma.event.findMany({
            where: {
                // Assume event duration is ~4h, or simplistic ended checking
                startAt: {
                    gte: yesterday,
                    lte: now,
                },
                status: "PUBLISHED"
            },
            include: {
                tickets: {
                    include: {
                        order: { include: { user: true } }
                    }
                }
            }
        });

        for (const event of pastEvents) {
            const usersToThank = new Map<string, any>();
            event.tickets.forEach((t: any) => {
                if (t.order.status === "PAID" && t.order.user) {
                    usersToThank.set(t.order.user.id, t.order.user);
                }
            });

            for (const [userId, user] of usersToThank.entries()) {
                const idempotencyKey = `post-event-thankyou-${event.id}-${userId}`;

                const result = await enqueueTemplate({
                    to: user.email,
                    templateId: "post-event-thankyou",
                    idempotencyKey,
                    variables: {
                        name: user.name || "Cliente",
                        eventTitle: event.title,
                    }
                });

                if (result.success && result.message === "Queued") {
                    results.thankYous++;
                }
            }
        }

        // 3. PROMOTER DAILY REPORTS (Run once daily around 9 AM usually)
        // Send to members of the organization with OWNER or ADMIN role
        const organizations = await prisma.organization.findMany({
            include: {
                members: {
                    where: { role: { in: ["PROMOTER_OWNER", "PROMOTER_MANAGER", "OWNER", "MANAGER"] } },
                    include: { user: true }
                },
                events: {
                    where: { startAt: { gte: now } },
                    orderBy: { startAt: "asc" },
                    take: 5
                }
            }
        });

        // We can use a daily key so it only runs once per day per person
        const todayStr = now.toISOString().split('T')[0];

        for (const org of organizations) {
            if (org.members.length === 0) continue;

            // Simplistic recent sales sum
            const recentSalesAggr = await prisma.order.aggregate({
                where: {
                    status: "PAID",
                    event: { organizationId: org.id },
                    updatedAt: { gte: yesterday } // Paid in the last 24h
                },
                _sum: { totalCents: true },
                _count: true
            });

            const totalSales = ((recentSalesAggr._sum?.totalCents || 0) / 100).toFixed(2) + " €";
            const ticketsSold = recentSalesAggr._count; // approximate

            const upcomingEvents = org.events.map((e: any) => ({
                title: e.title,
                date: e.startAt.toLocaleString('pt-PT'),
                sold: 0 // Ideally this would fetch actual sold counts, but keeping it simple for cron
            }));

            for (const member of org.members) {
                if (!member.user?.email) continue;

                const idempotencyKey = `promoter-daily-report-${org.id}-${member.userId}-${todayStr}`;
                const result = await enqueueTemplate({
                    to: member.user.email,
                    templateId: "promoter-daily-report",
                    idempotencyKey,
                    variables: {
                        promoterName: member.user.name || "Promotor",
                        date: todayStr,
                        totalSales,
                        ticketsSold,
                        upcomingEvents
                    }
                });

                if (result.success && result.message === "Queued") {
                    results.reports++;
                }
            }
        }

        // 4. PRÉ-REGISTO — avisar quando bilhetes ficam disponíveis (venda agendada)
        const alertResult = await TicketAlertService.processScheduledAlerts();
        results.ticketAlerts = alertResult.emails;

        safeLog.info("Email schedulers cron completed", results as any);
        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        safeLog.error("Email schedulers cron error", { error: error.message });
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
