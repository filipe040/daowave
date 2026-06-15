/**
 * Helpers para rotas legadas /api/organizer que antes usavam role global PROMOTER.
 */
import { prisma } from "@/lib/prisma";

export async function hasActiveOrgMembership(userId: string): Promise<boolean> {
  const count = await prisma.organizationMember.count({
    where: { userId, status: "ACTIVE" },
  });
  return count > 0;
}

/** Substitui `role !== "PROMOTER" && role !== "ADMIN"` nas rotas organizer. */
export async function canAccessLegacyOrganizerApi(
  userId: string,
  globalRole?: string | null
): Promise<boolean> {
  if (globalRole === "ADMIN") return true;
  return hasActiveOrgMembership(userId);
}

/** Substitui `role === "PROMOTER"` para filtrar por perfil de promotor. */
export function shouldScopeToPromoterProfile(globalRole?: string | null): boolean {
  return globalRole !== "ADMIN";
}
