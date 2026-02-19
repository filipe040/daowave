import { Role, MemberRole } from "@prisma/client";

export type SystemRole = Role;
export type OrganizationRole = MemberRole;

export enum Permission {
    // Global / Admin
    VIEW_ADMIN_DASHBOARD = "view:admin_dashboard",
    MANAGE_USERS = "manage:users",
    MANAGE_ORGANIZATIONS = "manage:organizations",
    VIEW_FINANCIALS = "view:financials",

    // Organization Level
    VIEW_ORG_DASHBOARD = "view:org_dashboard",
    MANAGE_ORG_SETTINGS = "manage:org_settings",
    MANAGE_ORG_MEMBERS = "manage:org_members",

    // Events
    CREATE_EVENT = "create:event",
    EDIT_EVENT = "edit:event",
    PUBLISH_EVENT = "publish:event",
    DELETE_EVENT = "delete:event",

    // Sales & Tickets
    VIEW_SALES = "view:sales",
    MANAGE_TICKETS = "manage:tickets",

    // Check-in
    SCAN_TICKETS = "scan:tickets",
}

// Permissions definitions map
const ROLE_PERMISSIONS: Record<SystemRole | OrganizationRole, Permission[]> = {
    // System Roles
    ADMIN: [
        Permission.VIEW_ADMIN_DASHBOARD,
        Permission.MANAGE_USERS,
        Permission.MANAGE_ORGANIZATIONS,
        Permission.VIEW_FINANCIALS,
        // Admins implicitly have access to everything, handled in logic
    ],
    USER: [], // Basic users have no special permissions
    PROMOTER: [], // Legacy role, mapped to OrganizationRole typically
    VALIDATOR: [], // Legacy role

    // Organization Roles
    OWNER: [
        Permission.VIEW_ORG_DASHBOARD,
        Permission.MANAGE_ORG_SETTINGS,
        Permission.MANAGE_ORG_MEMBERS,
        Permission.CREATE_EVENT,
        Permission.EDIT_EVENT,
        Permission.PUBLISH_EVENT,
        Permission.DELETE_EVENT,
        Permission.VIEW_SALES,
        Permission.MANAGE_TICKETS,
        Permission.SCAN_TICKETS,
    ],
    MANAGER: [
        Permission.VIEW_ORG_DASHBOARD,
        Permission.CREATE_EVENT,
        Permission.EDIT_EVENT,
        Permission.PUBLISH_EVENT,
        Permission.VIEW_SALES,
        Permission.MANAGE_TICKETS,
        Permission.SCAN_TICKETS,
    ],
    STAFF: [
        Permission.VIEW_ORG_DASHBOARD,
        Permission.SCAN_TICKETS, // Primary role for staff on-site
    ],
    READ_ONLY: [
        Permission.VIEW_ORG_DASHBOARD,
        Permission.VIEW_SALES,
    ]
};

/**
 * Check if a system role has a specific global permission
 */
export function hasSystemPermission(role: SystemRole, permission: Permission): boolean {
    if (role === "ADMIN") return true; // Superadmin bypass
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if an organization member role has a specific permission
 */
export function hasOrgPermission(role: OrganizationRole, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role (debug/UI use)
 */
export function getPermissionsForRole(role: SystemRole | OrganizationRole): Permission[] {
    return ROLE_PERMISSIONS[role] ?? [];
}
