export type AppRole = "USER" | "ADMIN" | "FINANCE_MANAGER" | "SUPPORT_AGENT";

function normalizeRole(rawRole: unknown): AppRole | null {
  if (!rawRole) return null;
  const role = String(rawRole).toUpperCase();
  if (
    role === "USER" ||
    role === "ADMIN" ||
    role === "FINANCE_MANAGER" ||
    role === "SUPPORT_AGENT"
  ) {
    return role as AppRole;
  }
  return null;
}

export function isAdmin(role: unknown): boolean {
  return normalizeRole(role) === "ADMIN";
}

/** Utilizador com membership em organização (não depende do role global). */
export function isPromoter(_role: unknown): boolean {
  return false;
}

export function isOrganizerRole(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === "ADMIN" || r === "FINANCE_MANAGER" || r === "SUPPORT_AGENT";
}

export function canAccessAdminArea(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === "ADMIN" || r === "FINANCE_MANAGER" || r === "SUPPORT_AGENT";
}

export function canAccessOrganizerArea(role: unknown): boolean {
  return isAdmin(role);
}

export function canAccessPromoterArea(_role: unknown): boolean {
  return true;
}

export function canManageEvent(params: {
  userRole: unknown;
  eventPromoterId: string;
  userPromoterId?: string | null;
}): boolean {
  const role = normalizeRole(params.userRole);
  if (role === "ADMIN") return true;
  return !!params.userPromoterId && params.userPromoterId === params.eventPromoterId;
}
