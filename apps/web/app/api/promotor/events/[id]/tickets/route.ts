import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePromoter } from "@/lib/auth/guards";
import { EventService } from "@/lib/services/event.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { orgId, session } = await requirePromoter();
    const globalRole = (session.user as any).role;
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketLots: {
          orderBy: { saleStartAt: "asc" },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Permission check: ADMIN bypasses; 
    // PROMOTER must be in the org or be the legacy owner
    if (globalRole !== "ADMIN") {
      const isInOrg = event.organizationId === orgId;

      let ownsViaProfile = false;
      if (!isInOrg) {
        const promoterProfile = await EventService.getPromoterProfile(session.user.id);
        ownsViaProfile = promoterProfile ? event.promoterId === promoterProfile.id : false;
      }

      if (!isInOrg && !ownsViaProfile) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json({ ticketLots: event.ticketLots });
  } catch (error) {
    console.error("[Get Event Tickets] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
