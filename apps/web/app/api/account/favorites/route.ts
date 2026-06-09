import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { EventFavoriteService } from "@/lib/services/event-favorite.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const idsOnly = searchParams.get("ids") === "1";

    if (idsOnly) {
      const ids = await EventFavoriteService.listIds(session.user.id);
      return NextResponse.json({ ids });
    }

    const events = await EventFavoriteService.listForUser(session.user.id);
    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const toggleSchema = z.object({
  eventId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = toggleSchema.parse(await req.json());
    const result = await EventFavoriteService.toggle(session.user.id, body.eventId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
