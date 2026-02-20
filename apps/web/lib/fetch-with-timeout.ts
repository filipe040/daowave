/**
 * fetchWithTimeout — fetch com AbortController e timeout configurável.
 * Default: 8 000 ms.
 */
export async function fetchWithTimeout(
    input: RequestInfo | URL,
    init: RequestInit = {},
    timeoutMs = 8_000
): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(input, { ...init, signal: controller.signal });
        return res;
    } catch (err: any) {
        if (err?.name === "AbortError") {
            throw new Error("Tempo limite esgotado. Verifique a ligação e tente novamente.");
        }
        throw err;
    } finally {
        clearTimeout(id);
    }
}
