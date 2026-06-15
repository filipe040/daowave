/** Caminho do painel interno (promotor/admin), ou null para conta de comprador. */
export function getStaffDashboardPath(
  role?: string | null,
  hasOrgAccess?: boolean
): string | null {
  if (hasOrgAccess) return "/promotor";
  if (role === "ADMIN" || role === "FINANCE_MANAGER" || role === "SUPPORT_AGENT") {
    return "/admin";
  }
  return null;
}

export function isStaffAccount(
  role?: string | null,
  hasOrgAccess?: boolean
): boolean {
  return getStaffDashboardPath(role, hasOrgAccess) !== null;
}

export function staffDashboardLabel(
  role?: string | null,
  hasOrgAccess?: boolean
): string {
  if (hasOrgAccess) return "Painel promotor";
  if (role === "ADMIN") return "Administração";
  if (role === "FINANCE_MANAGER") return "Finanças";
  if (role === "SUPPORT_AGENT") return "Suporte";
  return "Painel";
}

/** Redireciona promotores/admins para o painel — não podem usar área de comprador. */
export function staffDashboardRedirectPath(session: {
  user?: { role?: string; hasOrgAccess?: boolean };
} | null): string | null {
  if (!session?.user) return null;
  return getStaffDashboardPath(
    (session.user as { role?: string }).role,
    (session.user as { hasOrgAccess?: boolean }).hasOrgAccess === true
  );
}
