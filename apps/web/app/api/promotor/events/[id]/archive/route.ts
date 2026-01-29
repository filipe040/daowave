import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = params.id;
  const body = await request.json().catch(() => ({}));
  const archive = Boolean(body.archive);

  try {
    const promoter = await prisma.promoterProfile.findUnique({ where: { userId: session.user.id } });
    const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { promoterId: true, status: true } });
    if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if ((session.user as any).role !== "ADMIN" && promoter?.id !== ev.promoterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (archive) {
      // Only allow archive if published
      if (ev.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Only published events can be archived" }, { status: 400 });
      }
      await prisma.event.update({ where: { id: eventId }, data: { archivedAt: new Date() } });
      return NextResponse.json({ success: true, archived: true });
    } else {
      // unarchive: clear archivedAt, keep published status
      await prisma.event.update({ where: { id: eventId }, data: { archivedAt: null, status: "PUBLISHED" } });
      return NextResponse.json({ success: true, archived: false });
    }
  } catch (error) {
    console.error("[promotor/events/archive] POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const eventId = params.id;
  const body = await request.json().catch(() => ({}));
  const archive = Boolean(body.archive);

  try {
    const promoter = await prisma.promoterProfile.findUnique({ where: { userId: session.user.id } });
    const ev = await prisma.event.findUnique({ where: { id: eventId }, select: { promoterId: true, status: true } });
    if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if ((session.user as any).role !== "ADMIN" && promoter?.id !== ev.promoterId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (archive) {
      // Only allow archive if published
      if (ev.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Only published events can be archived" }, { status: 400 });
      }
      await prisma.event.update({ where: { id: eventId }, data: { archivedAt: new Date() } });
      return NextResponse.json({ success: true, archived: true });
    } else {
      // unarchive: clear archivedAt, keep published status
      await prisma.event.update({ where: { id: eventId }, data: { archivedAt: null, status: "PUBLISHED" } });
      return NextResponse.json({ success: true, archived: false });
    }
  } catch (error) {
    console.error("[promotor/events/archive] POST error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
