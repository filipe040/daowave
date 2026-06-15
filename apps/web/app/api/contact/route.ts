import { NextResponse } from "next/server";
import { z } from "zod";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";

const Schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

export async function POST(req: Request) {
  const rateLimitRes = await applyRateLimit(req, RATE_LIMITS.auth);
  if (rateLimitRes) return rateLimitRes;

  try {
    const body = Schema.parse(await req.json());

    console.log("[contact]", { ...body, to: process.env.SUPPORT_EMAIL || "support@livepass.pt" });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
