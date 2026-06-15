/**
 * Permission scopes for RBAC.
 * Platform roles: USER | ADMIN | FINANCE_MANAGER | SUPPORT_AGENT
 */

import type { AppRole } from "./permissions";

/** Permission scope: resource or area + optional action. Wildcards supported: admin:*, promoter:*, promoter:checkin:*, etc. */
export type PermissionScope =
  // Promoter
  | "promoter:overview"
  | "promoter:events"
  | "promoter:events:create"
  | "promoter:events:update"
  | "promoter:events:delete"
  | "promoter:sales"
  | "promoter:checkin"
  | "promoter:analytics"
  | "promoter:finance"
  | "promoter:team"
  | "promoter:settings"
  // Admin
  | "admin:overview"
  | "admin:promoters"
  | "admin:events"
  | "admin:users"
  | "admin:finance"
  | "admin:fraud"
  | "admin:system"
  | "admin:content"
  | "admin:audit"
  | "admin:settings"
  // User (comprador)
  | "user:tickets"
  | "user:orders"
  // Wildcards (used in ROLE_SCOPES for prefix match)
  | "promoter:*"
  | "admin:*";

const ROLE_SCOPES: Record<AppRole, PermissionScope[]> = {
  USER: ["user:tickets", "user:orders"],
  ADMIN: ["promoter:*", "admin:*"],
  FINANCE_MANAGER: ["admin:overview", "admin:finance", "admin:promoters"],
  SUPPORT_AGENT: ["admin:overview", "admin:users", "admin:events", "admin:promoters"],
};

function normalizeRole(rawRole: unknown): AppRole | null {
  if (!rawRole) return null;
  const role = String(rawRole).toUpperCase() as AppRole;
  if (role in ROLE_SCOPES) return role;
  return null;
}

/**
 * Check if a role has a given permission scope.
 * Supports wildcards: e.g. scope "admin:*" allows any "admin:..." scope;
 * "promoter:checkin:*" allows "promoter:checkin" and "promoter:checkin:...".
 */
export function can(role: unknown, scope: PermissionScope): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  const scopes = ROLE_SCOPES[r];
  if (!scopes) return false;
  if (scopes.includes(scope)) return true;
  const scopeStr = String(scope);
  for (const s of scopes) {
    const str = String(s);
    if (str.endsWith("*")) {
      const prefix = str.endsWith(":*") ? str.slice(0, -2) : str.slice(0, -1);
      if (scopeStr === prefix || scopeStr.startsWith(prefix + ":")) return true;
    }
  }
  return false;
}

/**
 * Get all scopes for a role (for UI or debugging).
 */
export function getScopesForRole(role: unknown): PermissionScope[] {
  const r = normalizeRole(role);
  if (!r) return [];
  return ROLE_SCOPES[r] ?? [];
}

