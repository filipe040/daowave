import type { Role } from "@prisma/client";

export const PLATFORM_ADMIN_ROLES: Role[] = ["ADMIN", "FINANCE_MANAGER", "SUPPORT_AGENT"];

export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  USER: "Utilizador",
  ADMIN: "Administrador",
  FINANCE_MANAGER: "Gestor financeiro",
  SUPPORT_AGENT: "Suporte",
};

export function canAccessAdminPanel(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "FINANCE_MANAGER" || role === "SUPPORT_AGENT";
}

export function isPlatformAdmin(role: string | undefined | null): boolean {
  return role === "ADMIN";
}

export function canAccessAdminFinance(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "FINANCE_MANAGER";
}

export function canAccessAdminSupport(role: string | undefined | null): boolean {
  return role === "ADMIN" || role === "SUPPORT_AGENT";
}

export function canManageAdminUsers(role: string | undefined | null): boolean {
  return role === "ADMIN";
}

export function canManageAdminOrganizations(role: string | undefined | null): boolean {
  return role === "ADMIN";
}

export function adminNavAllowed(path: string, role: string | undefined | null): boolean {
  if (!canAccessAdminPanel(role)) return false;
  if (role === "ADMIN") return true;

  if (role === "FINANCE_MANAGER") {
    return (
      path === "/admin" ||
      path.startsWith("/admin/finance") ||
      path.startsWith("/admin/organizations")
    );
  }

  if (role === "SUPPORT_AGENT") {
    return (
      path === "/admin" ||
      path.startsWith("/admin/users") ||
      path.startsWith("/admin/events") ||
      path.startsWith("/admin/organizations") ||
      path.startsWith("/admin/contact")
    );
  }

  return false;
}
