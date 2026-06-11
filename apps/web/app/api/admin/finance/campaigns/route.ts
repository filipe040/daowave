import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessFinanceAdmin } from "@/lib/finance/auth-guard";
import { FeeCampaignService } from "@/lib/finance/campaign.service";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const items = await FeeCampaignService.list();
    return NextResponse.json({ items });
  } catch (error) {
    safeLog.error("Admin campaigns list error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const campaign = await FeeCampaignService.create(
      {
        name: body.name,
        startDate: body.startDate,
        endDate: body.endDate,
        discountType: body.discountType,
        discountValue: Number(body.discountValue ?? 0),
        organizationId: body.organizationId ?? null,
        firstEventOnly: Boolean(body.firstEventOnly),
        active: body.active ?? true,
      },
      session.user.id
    );
    return NextResponse.json(campaign);
  } catch (error) {
    safeLog.error("Admin campaign create error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    const campaign = await FeeCampaignService.update(body.id, body, session.user.id);
    return NextResponse.json(campaign);
  } catch (error) {
    safeLog.error("Admin campaign update error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canAccessFinanceAdmin((session.user as { role?: string }).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    await FeeCampaignService.delete(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    safeLog.error("Admin campaign delete error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
