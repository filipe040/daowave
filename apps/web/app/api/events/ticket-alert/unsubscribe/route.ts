import { NextResponse } from "next/server";
import { TicketAlertService } from "@/lib/services/ticket-alert.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Token em falta", { status: 400 });
  }

  try {
    await TicketAlertService.unsubscribe(token);
    const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><title>Subscrição cancelada</title>
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}
.box{background:#fff;padding:2rem;border-radius:16px;max-width:400px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}</style></head>
<body><div class="box"><h1>Subscrição cancelada</h1><p>Não receberá mais avisos sobre bilhetes deste evento.</p></div></body></html>`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch {
    return new NextResponse("Registo não encontrado", { status: 404 });
  }
}
