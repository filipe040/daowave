import type { Role } from "@ticketing-platform/shared/src/rbac";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: Role;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    email?: string;
    name?: string | null;
  }
}
