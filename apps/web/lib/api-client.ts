/**
 * lib/api-client.ts
 *
 * Typed fetch wrappers for all dashboard API endpoints.
 * All functions use fetchWithTimeout (8s) and return { data, error } tuples.
 */

import { fetchWithTimeout } from "./fetch-with-timeout";

type Result<T> = { data: T; error: null } | { data: null; error: string };

async function get<T>(url: string, params?: Record<string, string | number | undefined>): Promise<Result<T>> {
    try {
        const qs = params
            ? "?" + Object.entries(params)
                .filter(([, v]) => v !== undefined && v !== "")
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                .join("&")
            : "";
        const res = await fetchWithTimeout(`${url}${qs}`);
        if (!res.ok) {
            const body = await res.json().catch(() => ({})) as { error?: string };
            return { data: null, error: body.error ?? `Erro ${res.status}` };
        }
        const data: T = await res.json();
        return { data, error: null };
    } catch (err: unknown) {
        return { data: null, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

async function patch<T>(url: string, body: unknown): Promise<Result<T>> {
    try {
        const res = await fetchWithTimeout(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const b = await res.json().catch(() => ({})) as { error?: string };
            return { data: null, error: b.error ?? `Erro ${res.status}` };
        }
        const data: T = await res.json();
        return { data, error: null };
    } catch (err: unknown) {
        return { data: null, error: err instanceof Error ? err.message : "Erro desconhecido" };
    }
}

// ─── Promotor ─────────────────────────────────────────────────────────────────

export interface PromoterStats {
    revenue: { total: number };
    tickets: { sold: number; capacity: number };
    events: { active: number };
    orders: { total: number };
}
export const getPromoterStats = () => get<PromoterStats>("/api/promotor/stats");

export interface AnalyticsPoint { date: string; revenueCents: number }
export interface PromoterAnalytics { data: AnalyticsPoint[]; from: string; to: string }
export const getPromoterAnalytics = (params?: { eventId?: string; from?: string; to?: string }) =>
    get<PromoterAnalytics>("/api/promotor/analytics", params);

export interface SalesOrder {
    id: string; status: string; totalCents: number; currency: string;
    buyerName: string | null; buyerEmail: string | null; createdAt: string;
    event: { id: string; title: string; slug: string };
    _count: { tickets: number };
}
export interface PaginatedOrders { data: SalesOrder[]; total: number; page: number; limit: number }
export const getPromoterSales = (params?: Record<string, string | number | undefined>) =>
    get<PaginatedOrders>("/api/promotor/sales", params);

export interface FinanceData {
    grossCents: number; currency: string; feesCents: number; netCents: number;
    payoutsPaidCents: number; payoutsPendingCents: number;
    payouts: Array<{ id: string; amountCents: number; status: string; createdAt: string }>;
}
export const getPromoterFinance = () => get<FinanceData>("/api/promotor/finance");

export interface OrgMember {
    id: string; role: string; createdAt: string;
    user: { id: string; name: string | null; email: string };
    organization: { id: string; name: string };
}
export const getPromoterTeam = () => get<{ data: OrgMember[] }>("/api/promotor/team");

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStats {
    users: number; events: number; activeOrganizations: number; orders: number; gmv: number;
}
export const getAdminStats = () => get<AdminStats>("/api/admin/stats");

export interface AdminEvent {
    id: string; title: string; slug: string; city: string; status: string; startAt: string;
    promoter: { id: string; brandName: string; user: { email: string } };
    _count: { tickets: number; orders: number };
}
export interface PaginatedEvents { data: AdminEvent[]; total: number; page: number; limit: number }
export const getAdminEvents = (params?: Record<string, string | number | undefined>) =>
    get<PaginatedEvents>("/api/admin/events", params);

export interface AdminUser {
    id: string; name: string | null; email: string; role: string;
    emailVerified: boolean; createdAt: string; _count: { orders: number };
}
export interface PaginatedUsers { data: AdminUser[]; total: number; page: number; limit: number }
export const getAdminUsers = (params?: Record<string, string | number | undefined>) =>
    get<PaginatedUsers>("/api/admin/users", params);
export const patchAdminUser = (id: string, body: unknown) =>
    patch<AdminUser>(`/api/admin/users/${id}`, body);

export interface Organization {
    id: string; name: string; slug: string; status: string; createdAt: string;
    _count?: { events: number; members: number };
    owner?: { name: string | null; email: string };
}
export interface PaginatedOrgs { organizations: Organization[]; total: number; page: number }
export const getAdminOrganizations = (params?: { page?: number; status?: string }) =>
    get<PaginatedOrgs>("/api/admin/organizations", params as Record<string, string | number | undefined>);

export interface AuditLog {
    id: string; action: string; entityType: string; entityId: string | null;
    actorUserId: string; createdAt: string; metaJson: string | null;
}
export interface PaginatedAuditLogs { data: AuditLog[]; total: number; page: number; limit: number }
export const getAuditLogs = (params?: Record<string, string | number | undefined>) =>
    get<PaginatedAuditLogs>("/api/admin/audit-logs", params);

export const approveAdminEvent = (id: string) =>
    patch<AdminEvent>(`/api/admin/events/${id}/approve`, {});
