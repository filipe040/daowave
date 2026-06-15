import { MemberRole } from "@prisma/client";

/** Mapeia valores legados (pré-migração) para cargos atuais. */
const LEGACY_ROLE_MAP: Record<string, MemberRole> = {
  OWNER: MemberRole.PROMOTER_OWNER,
  MANAGER: MemberRole.PROMOTER_MANAGER,
  STAFF: MemberRole.PROMOTER_CHECKIN,
  PROMOTER_STAFF: MemberRole.PROMOTER_CHECKIN,
};

export function normalizeMemberRole(role: MemberRole | string | null | undefined): MemberRole | null {
  if (!role) return null;
  const key = String(role);
  if (key in LEGACY_ROLE_MAP) return LEGACY_ROLE_MAP[key];
  if (Object.values(MemberRole).includes(key as MemberRole)) return key as MemberRole;
  return null;
}

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  [MemberRole.PROMOTER_OWNER]: "Proprietário",
  [MemberRole.PROMOTER_MANAGER]: "Gestor",
  [MemberRole.PROMOTER_FINANCE]: "Financeiro",
  [MemberRole.PROMOTER_CASHIER]: "Caixa (POS)",
  [MemberRole.PROMOTER_CHECKIN]: "Porteiro (check-in)",
  [MemberRole.READ_ONLY]: "Leitor",
};

export const INVITABLE_MEMBER_ROLES: MemberRole[] = [
  MemberRole.PROMOTER_MANAGER,
  MemberRole.PROMOTER_FINANCE,
  MemberRole.PROMOTER_CASHIER,
  MemberRole.PROMOTER_CHECKIN,
  MemberRole.READ_ONLY,
];

export const INVITABLE_MEMBER_ROLES_WITH_OWNER: MemberRole[] = [
  MemberRole.PROMOTER_OWNER,
  ...INVITABLE_MEMBER_ROLES,
];

export function memberRoleLabel(role: MemberRole | string): string {
  const normalized = normalizeMemberRole(role);
  return normalized ? MEMBER_ROLE_LABELS[normalized] : String(role);
}

export function isOrgOwner(role: MemberRole | string | null | undefined): boolean {
  const r = normalizeMemberRole(role);
  return r === MemberRole.PROMOTER_OWNER;
}

export function canManageOrgSettings(role: MemberRole | string | null | undefined): boolean {
  return isOrgOwner(role);
}

export function canManageOrgMembers(role: MemberRole | string | null | undefined): boolean {
  const r = normalizeMemberRole(role);
  return r === MemberRole.PROMOTER_OWNER || r === MemberRole.PROMOTER_MANAGER;
}

export function canInviteMembers(role: MemberRole | string | null | undefined): boolean {
  return canManageOrgMembers(role);
}

export function canRemoveMembers(role: MemberRole | string | null | undefined): boolean {
  return isOrgOwner(role);
}

export function canManageEvents(role: MemberRole | string | null | undefined): boolean {
  const r = normalizeMemberRole(role);
  return r === MemberRole.PROMOTER_OWNER || r === MemberRole.PROMOTER_MANAGER;
}

export function canManageTicketContent(role: MemberRole | string | null | undefined): boolean {
  return canManageEvents(role);
}

export function canEditTicketInventory(role: MemberRole | string | null | undefined): boolean {
  return isOrgOwner(role);
}

export function canViewSales(role: MemberRole | string | null | undefined): boolean {
  const r = normalizeMemberRole(role);
  if (!r) return false;
  return r !== MemberRole.PROMOTER_CHECKIN;
}

export function canAccessOrgFinance(role: MemberRole | string | null | undefined): boolean {
  const r = normalizeMemberRole(role);
  return (
    r === MemberRole.PROMOTER_OWNER ||
    r === MemberRole.PROMOTER_MANAGER ||
    r === MemberRole.PROMOTER_FINANCE
  );
}

export function canCreateManualSale(role: MemberRole | string | null | undefined): boolean {
  const r = normalizeMemberRole(role);
  return (
    r === MemberRole.PROMOTER_OWNER ||
    r === MemberRole.PROMOTER_MANAGER ||
    r === MemberRole.PROMOTER_CASHIER
  );
}

export function canCheckIn(role: MemberRole | string | null | undefined): boolean {
  const r = normalizeMemberRole(role);
  return (
    r === MemberRole.PROMOTER_OWNER ||
    r === MemberRole.PROMOTER_MANAGER ||
    r === MemberRole.PROMOTER_CASHIER ||
    r === MemberRole.PROMOTER_CHECKIN
  );
}

export function canAccessPromoterAnalytics(role: MemberRole | string | null | undefined): boolean {
  const r = normalizeMemberRole(role);
  return (
    r === MemberRole.PROMOTER_OWNER ||
    r === MemberRole.PROMOTER_MANAGER ||
    r === MemberRole.PROMOTER_FINANCE ||
    r === MemberRole.READ_ONLY
  );
}

export function canAccessPromoterOverview(role: MemberRole | string | null | undefined): boolean {
  return normalizeMemberRole(role) !== null;
}

/** Rotas do sidebar promotor visíveis por cargo */
export function promoterNavAllowed(
  href: string,
  role: MemberRole | string | null | undefined
): boolean {
  const r = normalizeMemberRole(role);
  if (!r) return false;

  if (href === "/promotor" || href.startsWith("/promotor?")) return canAccessPromoterOverview(r);
  if (href.startsWith("/promotor/events")) return canManageEvents(r);
  if (href.startsWith("/promotor/sales")) {
    if (href.includes("/manual")) return canCreateManualSale(r);
    return canViewSales(r);
  }
  if (href.startsWith("/promotor/checkin")) return canCheckIn(r);
  if (href.startsWith("/promotor/analytics")) return canAccessPromoterAnalytics(r);
  if (href.startsWith("/promotor/finance")) return canAccessOrgFinance(r);
  if (href.startsWith("/promotor/settings")) return canManageOrgSettings(r) || href.includes("/tickets");
  if (href.startsWith("/promotor/team")) return canManageOrgMembers(r);

  return canManageEvents(r);
}
