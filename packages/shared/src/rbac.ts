export type Role =
  | "USER"
  | "PROMOTER"
  | "ADMIN"
  | "FINANCE_MANAGER"
  | "SUPPORT_AGENT"
  | "VALIDATOR";

export function canAccessAdmin(role: Role) {
  return role === "ADMIN" || role === "FINANCE_MANAGER";
}

export function canAccessFinance(role: Role) {
  return role === "ADMIN" || role === "FINANCE_MANAGER";
}

export function canAccessOrganizer(role: Role) {
  return role === "PROMOTER" || role === "ADMIN";
}

export function canAccessValidator(role: Role) {
  return role === "ADMIN";
}