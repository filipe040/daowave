import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { authLimiter } from "@/lib/auth-rate-limit";

const nextAuthHandler = NextAuth(authOptions);

export async function GET(req: NextRequest, ctx: any) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const ok = authLimiter.check(ip, 30, 60_000);

    if (!ok) {
        return NextResponse.json(
            { error: "Demasiados pedidos. Tente novamente mais tarde." },
            { status: 429 }
        );
    }

    // In Next.js 15 App Router, NextAuth v4's handler takes (req, ctx)
    return nextAuthHandler(req, ctx);
}

export async function POST(req: NextRequest, ctx: any) {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const ok = authLimiter.check(ip, 30, 60_000);

    if (!ok) {
        return NextResponse.json(
            { error: "Demasiados pedidos. Tente novamente mais tarde." },
            { status: 429 }
        );
    }

    return nextAuthHandler(req, ctx);
}
