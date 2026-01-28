export type AppRole = "USER" | "PROMOTER" | "ADMIN";

function normalizeRole(rawRole: unknown): AppRole | null {
  if (!rawRole) return null;
  const role = String(rawRole).toUpperCase() as AppRole;
  if (role === "USER" || role === "PROMOTER" || role === "ADMIN") {
    return role;
  }
  return null;
}

export function isAdmin(role: unknown): boolean {
  return normalizeRole(role) === "ADMIN";
}

export function isPromoter(role: unknown): boolean {
  return normalizeRole(role) === "PROMOTER";
}

export function isOrganizerRole(role: unknown): boolean {
  const r = normalizeRole(role);
  return r === "PROMOTER" || r === "ADMIN";
}

export function canAccessAdminArea(role: unknown): boolean {
  return isAdmin(role);
}

export function canAccessOrganizerArea(role: unknown): boolean {
  return isOrganizerRole(role);
}

export function canAccessPromoterArea(role: unknown): boolean {
  return isOrganizerRole(role);
}

/**
 * Verifica se o utilizador pode gerir um determinado evento.
 * - ADMIN: pode sempre
 * - PROMOTER: apenas se for o promotor associado ao evento
 * - USER: nunca
 */
export function canManageEvent(params: {
  userRole: unknown;
  eventPromoterId: string;
  userPromoterId?: string | null;
}): boolean {
  const role = normalizeRole(params.userRole);
  if (role === "ADMIN") return true;
  if (role === "PROMOTER") {
    return !!params.userPromoterId && params.userPromoterId === params.eventPromoterId;
  }
  return false;
}

