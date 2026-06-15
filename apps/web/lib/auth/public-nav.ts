import { canAccessAdminPanel } from "./admin-access";

/** Caminho do painel interno (promotor/admin), ou null para conta de comprador. */
export function getStaffDashboardPath(
  role?: string | null,
  hasOrgAccess?: boolean
): string | null {
  if (canAccessAdminPanel(role)) return "/admin";
  if (hasOrgAccess) return "/promotor";
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
  if (canAccessAdminPanel(role)) {
    if (role === "FINANCE_MANAGER") return "Finanças";
    if (role === "SUPPORT_AGENT") return "Suporte";
    return "Administração";
  }
  if (hasOrgAccess) return "Painel promotor";
  return "Painel";
}

export type StaffDashboardOption = {
  href: string;
  label: string;
};

export function getStaffDashboardOptions(
  role?: string | null,
  hasOrgAccess?: boolean
): StaffDashboardOption[] {
  const options: StaffDashboardOption[] = [];
  if (canAccessAdminPanel(role)) {
    options.push({ href: "/admin", label: staffDashboardLabel(role, false) });
  }
  if (hasOrgAccess) {
    options.push({ href: "/promotor", label: "Painel promotor" });
  }
  return options;
}

export function getActiveStaffDashboardLabel(
  pathname: string | null | undefined,
  role?: string | null,
  hasOrgAccess?: boolean
): string {
  if (pathname?.startsWith("/admin")) return staffDashboardLabel(role, false);
  if (pathname?.startsWith("/promotor")) return "Painel promotor";
  return staffDashboardLabel(role, hasOrgAccess);
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
