import type { Role } from "@prisma/client";

export function canAccessFinanceAdmin(role: string | undefined): boolean {
  return role === "ADMIN" || role === "FINANCE_MANAGER";
}

export function getFinanceAdminRole(role: Role | undefined): Role | null {
  if (role === "ADMIN" || role === "FINANCE_MANAGER") return role;
  return null;
}
