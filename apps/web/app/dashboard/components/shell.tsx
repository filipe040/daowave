"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  MenuIcon,
  XIcon,
  HomeIcon,
  CalendarIcon,
  BarChart3Icon,
  CreditCardIcon,
  SettingsIcon,
  UsersIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  SearchIcon,
  ChevronDownIcon,
  UserIcon,
  LogOutIcon,
  ScanLineIcon,
  TrendingUpIcon
} from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

interface DashboardShellProps {
  session: Session;
  children: React.ReactNode;
}

type Context = "platform" | "promoter";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  contexts?: Context[];
}

const navigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    roles: ["ADMIN", "PROMOTER"],
    contexts: ["platform", "promoter"],
  },
  {
    label: "Eventos",
    href: "/dashboard/events",
    icon: CalendarIcon,
    roles: ["ADMIN", "PROMOTER"],
    contexts: ["platform", "promoter"],
  },
  {
    label: "Vendas",
    href: "/dashboard/sales",
    icon: TrendingUpIcon,
    roles: ["ADMIN", "PROMOTER"],
    contexts: ["platform", "promoter"],
  },
  {
    label: "Check-in",
    href: "/dashboard/checkin",
    icon: ScanLineIcon,
    roles: ["ADMIN", "PROMOTER"],
    contexts: ["platform", "promoter"],
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3Icon,
    roles: ["ADMIN", "PROMOTER"],
    contexts: ["platform", "promoter"],
  },
  {
    label: "Finanças",
    href: "/dashboard/finance",
    icon: CreditCardIcon,
    roles: ["ADMIN", "PROMOTER"],
    contexts: ["platform", "promoter"],
  },
  // Admin-only pages
  {
    label: "Promotores",
    href: "/dashboard/promoters",
    icon: UsersIcon,
    roles: ["ADMIN"],
    contexts: ["platform"],
  },
  {
    label: "Utilizadores",
    href: "/dashboard/users",
    icon: UsersIcon,
    roles: ["ADMIN"],
    contexts: ["platform"],
  },
  {
    label: "Auditoria",
    href: "/dashboard/audit",
    icon: ShieldCheckIcon,
    roles: ["ADMIN"],
    contexts: ["platform"],
  },
  {
    label: "Fraude",
    href: "/dashboard/fraud",
    icon: AlertTriangleIcon,
    roles: ["ADMIN"],
    contexts: ["platform"],
  },
  {
    label: "Definições",
    href: "/dashboard/settings",
    icon: SettingsIcon,
    roles: ["ADMIN", "PROMOTER"],
    contexts: ["platform", "promoter"],
  },
];

export default function DashboardShell({ session, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [context, setContext] = useState<Context>("promoter");
  const [selectedPromoterId, setSelectedPromoterId] = useState<string | null>(null);

  const userRole = (session.user as any)?.role;
  const isAdmin = userRole === "ADMIN";

  // Set default context based on role
  useEffect(() => {
    if (isAdmin) {
      setContext("platform");
    } else {
      setContext("promoter");
    }
  }, [isAdmin]);

  // Filter navigation items based on role and context
  const filteredNavigation = navigation.filter(item => {
    const hasRole = !item.roles || item.roles.includes(userRole);
    const hasContext = !item.contexts || item.contexts.includes(context);
    return hasRole && hasContext;
  });

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const ContextSelector = () => {
    if (!isAdmin) return null;

    return (
      <div className="relative">
        <button
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          data-testid="context-selector"
        >
          <span>{context === "platform" ? "Plataforma" : "Promotor"}</span>
          <ChevronDownIcon className="h-4 w-4" />
        </button>

        {profileMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1">
              <button
                onClick={() => {
                  setContext("platform");
                  setSelectedPromoterId(null);
                  setProfileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  context === "platform" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
                data-testid="context-platform"
              >
                Plataforma
              </button>
              <button
                onClick={() => {
                  setContext("promoter");
                  setProfileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  context === "promoter" ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                }`}
                data-testid="context-promoter"
              >
                Promotor
                {selectedPromoterId && (
                  <span className="text-xs text-gray-500 block">ID: {selectedPromoterId}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ProfileMenu = () => (
    <div className="relative">
      <button
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100"
        data-testid="profile-menu-button"
      >
        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
          <UserIcon className="h-5 w-5 text-gray-600" />
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700">
          {session.user?.name || session.user?.email}
        </span>
        <ChevronDownIcon className="hidden md:block h-4 w-4 text-gray-600" />
      </button>

      {profileMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-500 border-b">
              {session.user?.email}
              <div className="text-xs text-gray-400">{userRole}</div>
            </div>
            <Link
              href="/account/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setProfileMenuOpen(false)}
            >
              <UserIcon className="inline h-4 w-4 mr-2" />
              Perfil
            </Link>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              data-testid="sign-out-button"
            >
              <LogOutIcon className="inline h-4 w-4 mr-2" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const Breadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);

    return (
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
          </li>
          {segments.slice(1).map((segment, index) => (
            <li key={index} className="flex items-center space-x-2">
              <span className="text-gray-400">/</span>
              <span className="text-gray-700 capitalize">
                {segment.replace("-", " ")}
              </span>
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "block" : "hidden"} md:block md:flex-shrink-0`}>
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">EasyTicket</h1>
            </div>

            {/* Context Info */}
            <div className="mt-5 px-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {context === "platform" ? "Plataforma" : "Promotor"}
              </div>
              {context === "promoter" && selectedPromoterId && (
                <div className="text-xs text-gray-500 mt-1">
                  ID: {selectedPromoterId}
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${
                        isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                data-testid="mobile-menu-button"
              >
                {sidebarOpen ? (
                  <XIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )}
              </button>

              <Breadcrumbs />
            </div>

            <div className="flex items-center space-x-4">
              {/* Search (Admin only) */}
              {isAdmin && (
                <div className="relative hidden md:block">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    data-testid="global-search"
                  />
                </div>
              )}

              <ContextSelector />
              <ProfileMenu />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
