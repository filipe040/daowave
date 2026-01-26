export type Role = "USER" | "ORGANIZER" | "ADMIN" | "VALIDATOR";

export function canAccessAdmin(role: Role) {
  return role === "ADMIN";
}

export function canAccessOrganizer(role: Role) {
  return role === "ORGANIZER" || role === "ADMIN";
}

export function canAccessValidator(role: Role) {
  return role === "VALIDATOR" || role === "ADMIN";
}