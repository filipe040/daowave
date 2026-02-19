import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { EventService } from "@/lib/services/event.service";
import { OrganizationService } from "@/lib/services/organization";
import { NextRequest } from "next/server";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string(),
  venue: z.string(),
  city: z.string(),
  startAt: z.string().transform(str => new Date(str)),
  endAt: z.string().transform(str => new Date(str)),
  orgId: z.string(),
});

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "Organization ID required" }, { status: 400 });

  // TODO: Check permissions

  const page = Number(req.nextUrl.searchParams.get("page")) || 1;
  const data = await EventService.getByOrganization(orgId, page);

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const json = await req.json();
    const body = createEventSchema.parse(json);

    // TODO: Verify permission "create:event"

    const event = await EventService.create({
      title: body.title,
      slug: body.slug,
      description: body.description,
      venue: body.venue,
      city: body.city,
      startAt: body.startAt,
      endAt: body.endAt,
      organizationId: body.orgId,
      promoterId: token.id as string,
    });

    return NextResponse.json(event);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("[Create Event] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
