import { MemberRole, Role } from "@prisma/client";
import {
  normalizeMemberRole,
  canManageEvents,
  canManageOrgMembers,
  canManageOrgSettings,
  canViewSales,
  canCheckIn,
  canCreateManualSale,
  canAccessOrgFinance,
  isOrgOwner,
} from "@/lib/auth/member-permissions";

export type SystemRole = Role;
export type OrganizationRole = MemberRole;

export enum Permission {
  VIEW_ADMIN_DASHBOARD = "view:admin_dashboard",
  MANAGE_USERS = "manage:users",
  MANAGE_ORGANIZATIONS = "manage:organizations",
  VIEW_FINANCIALS = "view:financials",
  VIEW_ORG_DASHBOARD = "view:org_dashboard",
  MANAGE_ORG_SETTINGS = "manage:org_settings",
  MANAGE_ORG_MEMBERS = "manage:org_members",
  CREATE_EVENT = "create:event",
  EDIT_EVENT = "edit:event",
  PUBLISH_EVENT = "publish:event",
  DELETE_EVENT = "delete:event",
  VIEW_SALES = "view:sales",
  MANAGE_TICKETS = "manage:tickets",
  SCAN_TICKETS = "scan:tickets",
  MANUAL_SALE = "manual:sale",
  VIEW_ORG_FINANCE = "view:org_finance",
}

function orgPermissions(role: MemberRole | string | null | undefined): Permission[] {
  const perms = new Set<Permission>();

  if (canAccessPromoterOverview(role)) perms.add(Permission.VIEW_ORG_DASHBOARD);
  if (canManageOrgSettings(role)) {
    perms.add(Permission.MANAGE_ORG_SETTINGS);
    perms.add(Permission.MANAGE_ORG_MEMBERS);
  } else if (canManageOrgMembers(role)) {
    perms.add(Permission.MANAGE_ORG_MEMBERS);
  }
  if (canManageEvents(role)) {
    perms.add(Permission.CREATE_EVENT);
    perms.add(Permission.EDIT_EVENT);
    perms.add(Permission.PUBLISH_EVENT);
    perms.add(Permission.DELETE_EVENT);
    perms.add(Permission.MANAGE_TICKETS);
  }
  if (isOrgOwner(role)) perms.add(Permission.DELETE_EVENT);
  if (canViewSales(role)) perms.add(Permission.VIEW_SALES);
  if (canCheckIn(role)) perms.add(Permission.SCAN_TICKETS);
  if (canCreateManualSale(role)) perms.add(Permission.MANUAL_SALE);
  if (canAccessOrgFinance(role)) perms.add(Permission.VIEW_ORG_FINANCE);

  return [...perms];
}

function canAccessPromoterOverview(role: MemberRole | string | null | undefined): boolean {
  return normalizeMemberRole(role) !== null;
}

const SYSTEM_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    Permission.VIEW_ADMIN_DASHBOARD,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ORGANIZATIONS,
    Permission.VIEW_FINANCIALS,
  ],
  FINANCE_MANAGER: [Permission.VIEW_ADMIN_DASHBOARD, Permission.VIEW_FINANCIALS],
  SUPPORT_AGENT: [Permission.VIEW_ADMIN_DASHBOARD, Permission.MANAGE_USERS],
  USER: [],
};

export function hasSystemPermission(role: SystemRole, permission: Permission): boolean {
  if (role === "ADMIN") return true;
  return SYSTEM_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasOrgPermission(role: OrganizationRole | string, permission: Permission): boolean {
  return orgPermissions(role).includes(permission);
}

export function getPermissionsForRole(role: SystemRole | OrganizationRole | string): Permission[] {
  const normalized = normalizeMemberRole(role);
  if (normalized) return orgPermissions(normalized);
  if (role in SYSTEM_PERMISSIONS) return SYSTEM_PERMISSIONS[role as Role];
  return [];
}
