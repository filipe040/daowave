import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { getStaffDashboardPath, isStaffAccount } from "./public-nav";

export const STAFF_PURCHASE_DENIED =
  "Contas de administração e promotores não podem comprar bilhetes.";

export function sessionIsStaff(session: Session | null | undefined): boolean {
  if (!session?.user) return false;
  const role = (session.user as { role?: string }).role;
  const hasOrgAccess =
    (session.user as { hasOrgAccess?: boolean }).hasOrgAccess === true;
  return isStaffAccount(role, hasOrgAccess);
}

export function staffDashboardFromSession(
  session: Session | null | undefined
): string | null {
  if (!session?.user) return null;
  return getStaffDashboardPath(
    (session.user as { role?: string }).role,
    (session.user as { hasOrgAccess?: boolean }).hasOrgAccess === true
  );
}

export function staffPurchaseDeniedResponse() {
  return NextResponse.json({ error: STAFF_PURCHASE_DENIED }, { status: 403 });
}

/** Rotas da área de conta reservadas a compradores (staff é redirecionado). */
export const BUYER_ONLY_ACCOUNT_PATHS = [
  "/account",
  "/account/profile",
  "/account/favorites",
  "/account/notifications",
  "/account/orders",
  "/account/tickets",
] as const;

export function isBuyerOnlyAccountPath(pathname: string): boolean {
  if (pathname === "/account") return true;
  return BUYER_ONLY_ACCOUNT_PATHS.some(
    (p) => p !== "/account" && (pathname === p || pathname.startsWith(`${p}/`))
  );
}
