"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AccountSidebar from "./account-sidebar";
import { isBuyerOnlyAccountPath } from "@/lib/auth/buyer-access";
import { getStaffDashboardPath, isStaffAccount } from "@/lib/auth/public-nav";

export default function AccountLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user || !pathname || !isBuyerOnlyAccountPath(pathname)) return;
    const role = (session.user as { role?: string }).role;
    const hasOrgAccess =
      (session.user as { hasOrgAccess?: boolean }).hasOrgAccess === true;
    if (!isStaffAccount(role, hasOrgAccess)) return;
    const dest = getStaffDashboardPath(role, hasOrgAccess);
    if (dest) router.replace(dest);
  }, [session, pathname, router]);

  return (
    <div className="min-h-screen dash-shell">
      <AccountSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="md:pl-72 relative">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-[#14141f]/90 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5"
              aria-label="Abrir menu"
              data-testid="account-mobile-menu-toggle"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">
              Área de conta
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
