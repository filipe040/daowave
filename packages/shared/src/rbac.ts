export type Role = "USER" | "PROMOTER" | "ADMIN" | "VALIDATOR";

export function canAccessAdmin(role: Role) {
  return role === "ADMIN";
}

export function canAccessOrganizer(role: Role) {
  return role === "PROMOTER" || role === "ADMIN";
}

export function canAccessValidator(role: Role) {
  return role === "ADMIN"; // Validators removed, only ADMIN can validate
}