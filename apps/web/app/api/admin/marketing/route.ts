import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { MarketingService } from "@/lib/services/marketing";
import { z } from "zod";

const CampaignSchema = z.object({
  subject: z.string().min(3),
  title: z.string().min(3),
  content: z.string().min(10),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await MarketingService.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Marketing Stats GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = CampaignSchema.parse(body);

    const result = await MarketingService.dispatchCustomCampaign(
      data.subject,
      data.title,
      data.content
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[Marketing Dispatch POST]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
