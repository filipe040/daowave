import { buildPublicArtistsPayload } from "@/lib/services/public-artists-api.service";
import {
    publicErrorResponse,
    publicJsonResponse,
    publicOptionsResponse,
} from "@/lib/api/public-response";

export const dynamic = "force-dynamic";

/**
 * API pública v1 — lista de artistas de um evento para integração em sites externos.
 *
 * GET /api/public/v1/events/{slug}/artists
 *
 * CORS: * (qualquer origem pode consumir via fetch no browser)
 */
export async function OPTIONS() {
    return publicOptionsResponse();
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const origin = req.headers.get("origin") || new URL(req.url).origin;

        const payload = await buildPublicArtistsPayload(slug, {
            origin,
            selfPath: `/api/public/v1/events/${slug}/artists`,
        });

        if (!payload) {
            return publicErrorResponse("Evento não encontrado ou não publicado", 404);
        }

        return publicJsonResponse(payload);
    } catch (error) {
        console.error("[GET /api/public/v1/events/[slug]/artists]", error);
        return publicErrorResponse("Erro interno", 500);
    }
}
