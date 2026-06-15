import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import crypto from "crypto";

const Schema = z.object({
  email: z.string().email(),
  source: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.auth);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { email, source } = Schema.parse(await req.json());
    const normalized = email.toLowerCase().trim();

    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      create: {
        id: crypto.randomUUID(),
        email: normalized,
        source: source ?? "homepage",
      },
      update: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    console.error("[newsletter]", error);
    return NextResponse.json({ error: "Erro ao subscrever" }, { status: 500 });
  }
}
