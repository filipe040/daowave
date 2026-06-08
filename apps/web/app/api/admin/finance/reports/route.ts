import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { safeLog } from "@/lib/security";
import { FinanceReportService } from "@/lib/finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") ?? "daily") as "daily" | "weekly" | "monthly";
    const format = searchParams.get("format") ?? "json";

    const report = await FinanceReportService.generateReport(period);

    if (format === "csv") {
      const csv = FinanceReportService.reportToCsv([report]);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="livepass-finance-${period}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    safeLog.error("Admin finance report error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
