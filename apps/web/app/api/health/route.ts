import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Health check endpoint
 * Lightweight checks: DB + optional services via dynamic imports
 */
export async function GET() {
  // Dynamic import to avoid heavy init at build time
  const { config } = await import("@/lib/config").catch(() => ({ config: { env: { name: "unknown" }, storage: { enabled: false }, email: { enabled: false }, payments: { stripe: { enabled: false }, mock: { enabled: false } } } }));

  const checks: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config?.env?.name ?? "unknown",
    services: {
      database: { status: "unknown", latency: 0 },
      storage: { status: config?.storage?.enabled ? "enabled" : "disabled" },
      email: { status: config?.email?.enabled ? "enabled" : "disabled" },
      payments: { stripe: config?.payments?.stripe?.enabled ?? false, mock: config?.payments?.mock?.enabled ?? false },
      redis: { status: process.env.REDIS_URL ? "enabled" : "disabled", enabled: Boolean(process.env.REDIS_URL) },
    },
  };

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = { status: "ok", latency: Date.now() - start };
  } catch (e) {
    console.error("[health] DB error:", e);
    checks.services.database = { status: "error", latency: 0 };
    checks.status = "degraded";
  }

  const statusCode = checks.status === "ok" ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
