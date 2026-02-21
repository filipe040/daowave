import { fetchWithTimeout } from "./fetch-with-timeout";

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

/**
 * api-client: Wrapper tipado para chamadas à API do Dashboard
 */
export async function apiFetch<T>(
    url: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const res = await fetchWithTimeout(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        const data = await res.json();

        if (!res.ok) {
            return {
                data: null,
                error: data.error || `Erro ${res.status}: ${res.statusText}`,
            };
        }

        return { data, error: null };
    } catch (err: any) {
        console.error(`[apiFetch] ${url}:`, err);
        return {
            data: null,
            error: err.message || "Erro de ligação. Tente novamente.",
        };
    }
}

export const api = {
    get: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: "GET" }),
    post: <T>(url: string, body: any, options?: RequestInit) =>
        apiFetch<T>(url, { ...options, method: "POST", body: JSON.stringify(body) }),
    patch: <T>(url: string, body: any, options?: RequestInit) =>
        apiFetch<T>(url, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: "DELETE" }),
};
