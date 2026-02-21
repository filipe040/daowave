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

// Types used by Admin/Dashboard pages
export interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    actorUserId: string;
    createdAt: string;
}

export interface Organization {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: string;
}

export interface FinanceData {
    grossCents: number;
    feesCents: number;
    netCents: number;
    payoutsPendingCents: number;
    payoutsPaidCents: number;
    currency: string;
    payouts: Array<{
        id: string;
        amountCents: number;
        status: string;
        createdAt: string;
    }>;
}

// Named exports for specific modules (Restored to fix build)
export async function getAuditLogs(params: any) {
    const searchParams = new URLSearchParams(params);
    return api.get<{ data: AuditLog[]; total: number }>(`/api/admin/audit-logs?${searchParams.toString()}`);
}

export async function getAdminOrganizations(params: any) {
    const searchParams = new URLSearchParams(params);
    return api.get<{ organizations: Organization[]; total: number }>(`/api/admin/organizations?${searchParams.toString()}`);
}

export async function getPromoterFinance() {
    return api.get<FinanceData>("/api/promotor/finance");
}
