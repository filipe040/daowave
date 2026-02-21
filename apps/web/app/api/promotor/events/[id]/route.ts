import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { EventService } from "@/lib/services/event";
import { NextRequest } from "next/server";
import { z } from "zod";

const updateEventSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  startAt: z.string().transform(str => new Date(str)).optional(),
  endAt: z.string().transform(str => new Date(str)).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED']).optional(),
});

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  // TODO: Check ownership/permission

  const event = await EventService.getById(params.id);
  if (!event) return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });

  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const json = await req.json();
    const body = updateEventSchema.parse(json);

    // TODO: Check permission "edit:event"

    const updateData = { ...body };
    if (body.status) {
      (updateData as any).status = body.status;
    }

    const event = await EventService.update(params.id, updateData as any);
    return NextResponse.json(event);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
