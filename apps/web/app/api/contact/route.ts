import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, RATE_LIMITS } from "@/lib/security";
import { sendHtml } from "@/lib/email-service";
import { getCompanyInfo } from "@/lib/company";
import crypto from "crypto";

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
    const { email: supportEmail } = getCompanyInfo();

    await prisma.contactMessage.create({
      data: {
        id: crypto.randomUUID(),
        name: body.name,
        email: body.email.toLowerCase().trim(),
        subject: body.subject,
        message: body.message,
        status: "NEW",
      },
    });

    const html = `
      <h2>Novo contacto — LivePass</h2>
      <p><strong>Nome:</strong> ${body.name}</p>
      <p><strong>Email:</strong> ${body.email}</p>
      <p><strong>Assunto:</strong> ${body.subject}</p>
      <hr />
      <p>${body.message.replace(/\n/g, "<br />")}</p>
    `;

    await sendHtml({
      to: supportEmail,
      subject: `[Contacto] ${body.subject}`,
      html,
      replyTo: body.email,
      idempotencyKey: `contact-${Date.now()}-${body.email}`,
    }).catch((err) => {
      console.error("[contact] email send failed (message saved):", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[contact]", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
