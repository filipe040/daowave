import { NextResponse } from "next/server";

/**
 * GET /api/debug/email-test
 * Tests email sending directly. Protected by a secret query param.
 */
export async function GET(req: Request) {
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");

    // Simple protection
    if (secret !== process.env.INTERNAL_API_SECRET && secret !== "daowave-debug-2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const to = url.searchParams.get("to") || "vascomelo2005@gmail.com";

    const results: Record<string, any> = {
        env: {
            EMAILS_ENABLED: process.env.EMAILS_ENABLED,
            RESEND_API_KEY_prefix: process.env.RESEND_API_KEY?.substring(0, 8),
            EMAIL_FROM: process.env.EMAIL_FROM,
            EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
            APP_URL: process.env.APP_URL,
        }
    };

    // Try sending directly via Resend without any wrapper
    try {
        const { Resend } = await import("resend");
        const apiKey = process.env.RESEND_API_KEY?.trim().replace(/^[\"']|[\"']$/g, '');
        results.cleanedApiKey = apiKey?.substring(0, 8);

        const client = new Resend(apiKey);
        const fromEmail = process.env.EMAIL_FROM?.trim().replace(/^[\"']|[\"']$/g, '') || "no-reply@livepass.pt";
        results.cleanedFrom = fromEmail;

        const result = await client.emails.send({
            from: fromEmail,
            to,
            subject: "Teste de Email - LivePass Debug",
            html: "<h1>Teste de Email</h1><p>Se recebeste este email, o Resend está a funcionar corretamente!</p>",
        });

        results.resendResult = { data: result.data, error: result.error };
    } catch (err: any) {
        results.resendError = { message: err.message, stack: err.stack?.substring(0, 500) };
    }

    // Try via EmailService
    try {
        const { EmailService } = await import("@/lib/email-service");
        const serviceResult = await EmailService.sendHtml({
            to,
            subject: "Teste via EmailService - LivePass",
            html: "<h1>Teste via EmailService</h1><p>Este email foi enviado pelo EmailService.</p>",
        });
        results.emailServiceResult = serviceResult;
    } catch (err: any) {
        results.emailServiceError = { message: err.message, stack: err.stack?.substring(0, 500) };
    }

    return NextResponse.json(results, { status: 200 });
}
