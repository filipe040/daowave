/**
 * Converte um link Google Maps partilhado num URL de embed para iframe.
 */
export function toGoogleMapsEmbedUrl(
    locationUrl: string | null | undefined,
    fallbackQuery: string
): string {
    const fallback = `https://maps.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&z=15&output=embed`;

    if (!locationUrl?.trim()) return fallback;

    const url = locationUrl.trim();

    if (url.includes("output=embed")) return url;

    try {
        const parsed = new URL(url);

        const q = parsed.searchParams.get("q");
        if (q) {
            return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
        }

        const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/]+)/);
        if (placeMatch) {
            const place = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
            return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=15&output=embed`;
        }

        const coordMatch = parsed.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordMatch) {
            return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&z=15&output=embed`;
        }

        return `${url}${url.includes("?") ? "&" : "?"}output=embed`;
    } catch {
        return fallback;
    }
}

/** Extrai texto legível do link para exibição (quando venue está vazio). */
export function locationLabelFromUrl(locationUrl: string | null | undefined): string | null {
    if (!locationUrl?.trim()) return null;
    try {
        const parsed = new URL(locationUrl.trim());
        const q = parsed.searchParams.get("q");
        if (q) return decodeURIComponent(q.replace(/\+/g, " "));
        const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/@]+)/);
        if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    } catch {
        /* ignore */
    }
    return null;
}

export function resolveEventLocation(
    event: { venue: string; city: string; locationUrl?: string | null },
    artist?: { venue?: string | null; locationUrl?: string | null } | null
) {
    const venueDisplay =
        artist?.venue ||
        locationLabelFromUrl(artist?.locationUrl) ||
        event.venue;

    const locationUrl = artist?.locationUrl || event.locationUrl || null;
    const mapEmbedUrl = toGoogleMapsEmbedUrl(
        locationUrl,
        `${venueDisplay}, ${event.city}, Portugal`
    );

    return { venueDisplay, locationUrl, mapEmbedUrl };
}
