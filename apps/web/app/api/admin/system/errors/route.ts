import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/system/errors
 * Get recent critical errors from AuditLog
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recent errors from AuditLog
    // For now, we'll look for actions that indicate errors
    // In production, you might want a separate ErrorLog table
    const recentErrors = await prisma.auditLog.findMany({
      where: {
        action: {
          contains: "ERROR",
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        userId: true,
      },
    });

    // Also check EmailLog for failed emails
    const failedEmails = await prisma.emailLog.findMany({
      where: {
        status: "FAILED",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        to: true,
        subject: true,
        error: true,
        retryCount: true,
        createdAt: true,
      },
    });

    // Format errors
    const errors = [
      ...recentErrors.map((err) => ({
        id: err.id,
        message: err.action,
        level: "error",
        timestamp: err.createdAt.toISOString(),
        context: err.details,
      })),
      ...failedEmails.map((email) => ({
        id: email.id,
        message: `Email failed: ${email.subject}`,
        level: "error",
        timestamp: email.createdAt.toISOString(),
        context: {
          to: email.to,
          error: email.error,
          retryCount: email.retryCount,
        },
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50); // Limit to 50 most recent

    return NextResponse.json({ errors });
  } catch (error: any) {
    console.error("Failed to fetch errors:", error);
    return NextResponse.json(
      { error: "Failed to fetch errors", errors: [] },
      { status: 500 }
    );
  }
}

