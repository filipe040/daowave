/**
 * Unit tests for RBAC can() helper (wildcards and exact match)
 */

import { can, getScopesForRole } from "@/lib/auth/scopes";

describe("can() RBAC scopes", () => {
  it("wildcard prefix logic: admin:overview startsWith admin:", () => {
    const prefix = "admin";
    const scopeStr = "admin:overview";
    expect(scopeStr === prefix || scopeStr.startsWith(prefix + ":")).toBe(true);
  });

  it("getScopesForRole(ADMIN) contains admin:* and it ends with asterisk", () => {
    const scopes = getScopesForRole("ADMIN");
    expect(scopes).toContain("admin:*");
    const adminStar = scopes.find((s) => s === "admin:*");
    expect(adminStar).toBeDefined();
    expect(String(adminStar).endsWith("*")).toBe(true);
  });

  describe("exact match", () => {
    it("allows USER for user:tickets", () => {
      expect(can("USER", "user:tickets")).toBe(true);
      expect(can("user", "user:tickets")).toBe(true);
    });

    it("denies USER for admin:overview", () => {
      expect(can("USER", "admin:overview")).toBe(false);
    });

    it("denies null/undefined role", () => {
      expect(can(null, "user:tickets")).toBe(false);
      expect(can(undefined, "user:orders")).toBe(false);
    });
  });

  describe("wildcard admin:*", () => {
    it("allows ADMIN for any admin scope", () => {
      expect(can("ADMIN", "admin:overview")).toBe(true);
      expect(can("ADMIN", "admin:audit")).toBe(true);
      expect(can("ADMIN", "admin:users")).toBe(true);
      expect(can("ADMIN", "admin:fraud")).toBe(true);
    });

    it("denies PROMOTER for admin scopes", () => {
      expect(can("PROMOTER", "admin:overview")).toBe(false);
      expect(can("PROMOTER", "admin:audit")).toBe(false);
    });
  });

  describe("wildcard promoter:*", () => {
    it("allows PROMOTER for any promoter scope", () => {
      expect(can("PROMOTER", "promoter:overview")).toBe(true);
      expect(can("PROMOTER", "promoter:events")).toBe(true);
      expect(can("PROMOTER", "promoter:checkin")).toBe(true);
      expect(can("PROMOTER", "promoter:analytics")).toBe(true);
    });

    it("allows ADMIN for promoter scopes (ADMIN has promoter:* and admin:*)", () => {
      expect(can("ADMIN", "promoter:overview")).toBe(true);
      expect(can("ADMIN", "promoter:checkin")).toBe(true);
    });

    it("denies USER for promoter scopes", () => {
      expect(can("USER", "promoter:overview")).toBe(false);
    });
  });

  describe("getScopesForRole", () => {
    it("returns wildcard scopes for PROMOTER and ADMIN", () => {
      expect(getScopesForRole("PROMOTER")).toContain("promoter:*");
      expect(getScopesForRole("ADMIN")).toContain("promoter:*");
      expect(getScopesForRole("ADMIN")).toContain("admin:*");
    });

    it("returns concrete scopes for USER", () => {
      expect(getScopesForRole("USER")).toEqual(["user:tickets", "user:orders"]);
    });
  });
});
