import { NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";

const Schema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.auth);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { email } = Schema.parse(await req.json());
    const normalized = email.toLowerCase().trim();

    console.log("[newsletter] subscribe", normalized);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao subscrever" }, { status: 500 });
  }
}
