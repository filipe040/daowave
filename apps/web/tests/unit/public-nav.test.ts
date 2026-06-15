import {
  getStaffDashboardPath,
  getStaffDashboardOptions,
  isStaffAccount,
  staffDashboardLabel,
} from "../../lib/auth/public-nav";

describe("public-nav staff routing", () => {
  it("platform admin goes to /admin even without org", () => {
    expect(getStaffDashboardPath("ADMIN", false)).toBe("/admin");
    expect(isStaffAccount("ADMIN", false)).toBe(true);
  });

  it("hasOrgAccess alone routes to promotor for regular users", () => {
    expect(getStaffDashboardPath("USER", true)).toBe("/promotor");
    expect(isStaffAccount("USER", true)).toBe(true);
  });

  it("platform role takes priority over org membership", () => {
    expect(getStaffDashboardPath("ADMIN", true)).toBe("/admin");
    expect(getStaffDashboardOptions("ADMIN", true)).toEqual([
      { href: "/admin", label: "Administração" },
      { href: "/promotor", label: "Painel promotor" },
    ]);
  });

  it("buyer without org is not staff", () => {
    expect(getStaffDashboardPath("USER", false)).toBeNull();
    expect(isStaffAccount("USER", false)).toBe(false);
  });

  it("labels reflect primary dashboard", () => {
    expect(staffDashboardLabel("FINANCE_MANAGER", false)).toBe("Finanças");
    expect(staffDashboardLabel("USER", true)).toBe("Painel promotor");
  });
});
