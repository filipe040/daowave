import { NextResponse } from "next/server";

const PUBLIC_METHODS = "GET, OPTIONS";
const PUBLIC_HEADERS = "Content-Type, Accept, Origin";

/** Resposta JSON com CORS aberto para integração em sites externos (somente leitura). */
export function publicJsonResponse(data: unknown, init?: ResponseInit) {
    const headers = new Headers(init?.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", PUBLIC_METHODS);
    headers.set("Access-Control-Allow-Headers", PUBLIC_HEADERS);
    headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    headers.set("Content-Type", "application/json; charset=utf-8");

    return NextResponse.json(data, { ...init, headers });
}

export function publicOptionsResponse() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": PUBLIC_METHODS,
            "Access-Control-Allow-Headers": PUBLIC_HEADERS,
            "Access-Control-Max-Age": "86400",
        },
    });
}

export function publicErrorResponse(message: string, status: number) {
    return publicJsonResponse({ error: message }, { status });
}
