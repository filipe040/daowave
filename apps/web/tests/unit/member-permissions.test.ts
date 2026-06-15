import { MemberRole } from "@prisma/client";
import {
  canAssignMemberRole,
  canRemoveMembers,
  canRemoveTargetMember,
  canCheckIn,
  canViewSales,
  canAccessOrgFinance,
  canRequestWithdrawal,
  promoterNavAllowed,
} from "@/lib/auth/member-permissions";

describe("member-permissions", () => {
  describe("canRemoveMembers", () => {
    it("proprietário e gestor podem remover membros", () => {
      expect(canRemoveMembers(MemberRole.PROMOTER_OWNER)).toBe(true);
      expect(canRemoveMembers(MemberRole.PROMOTER_MANAGER)).toBe(true);
      expect(canRemoveMembers(MemberRole.PROMOTER_FINANCE)).toBe(false);
    });
  });

  describe("canRemoveTargetMember", () => {
    it("gestor não remove proprietário", () => {
      expect(
        canRemoveTargetMember(MemberRole.PROMOTER_MANAGER, MemberRole.PROMOTER_OWNER)
      ).toBe(false);
      expect(
        canRemoveTargetMember(MemberRole.PROMOTER_MANAGER, MemberRole.PROMOTER_CHECKIN)
      ).toBe(true);
    });
  });
  describe("canAssignMemberRole", () => {
    it("owner pode atribuir qualquer cargo", () => {
      expect(canAssignMemberRole(MemberRole.PROMOTER_OWNER, MemberRole.PROMOTER_OWNER)).toBe(true);
      expect(canAssignMemberRole(MemberRole.PROMOTER_OWNER, MemberRole.PROMOTER_CHECKIN)).toBe(true);
    });

    it("gestor não pode atribuir proprietário", () => {
      expect(canAssignMemberRole(MemberRole.PROMOTER_MANAGER, MemberRole.PROMOTER_OWNER)).toBe(false);
      expect(canAssignMemberRole(MemberRole.PROMOTER_MANAGER, MemberRole.PROMOTER_FINANCE)).toBe(true);
    });

    it("porteiro não pode convidar", () => {
      expect(canAssignMemberRole(MemberRole.PROMOTER_CHECKIN, MemberRole.PROMOTER_CHECKIN)).toBe(false);
    });
  });

  describe("canViewSales", () => {
    it("porteiro não vê vendas", () => {
      expect(canViewSales(MemberRole.PROMOTER_CHECKIN)).toBe(false);
    });

    it("caixa vê vendas", () => {
      expect(canViewSales(MemberRole.PROMOTER_CASHIER)).toBe(true);
    });
  });

  describe("canRequestWithdrawal", () => {
    it("só proprietário e financeiro pedem levantamento", () => {
      expect(canRequestWithdrawal(MemberRole.PROMOTER_OWNER)).toBe(true);
      expect(canRequestWithdrawal(MemberRole.PROMOTER_FINANCE)).toBe(true);
      expect(canRequestWithdrawal(MemberRole.PROMOTER_MANAGER)).toBe(false);
    });
  });

  describe("promoterNavAllowed", () => {
    it("financeiro vê finanças mas não eventos", () => {
      expect(promoterNavAllowed("/promotor/finance", MemberRole.PROMOTER_FINANCE)).toBe(true);
      expect(promoterNavAllowed("/promotor/events", MemberRole.PROMOTER_FINANCE)).toBe(false);
    });

    it("porteiro só vê check-in e overview", () => {
      expect(promoterNavAllowed("/promotor/checkin", MemberRole.PROMOTER_CHECKIN)).toBe(true);
      expect(promoterNavAllowed("/promotor/sales", MemberRole.PROMOTER_CHECKIN)).toBe(false);
      expect(promoterNavAllowed("/promotor", MemberRole.PROMOTER_CHECKIN)).toBe(true);
    });

    it("gestor vê cupões mas não definições gerais", () => {
      expect(promoterNavAllowed("/promotor/settings/coupon", MemberRole.PROMOTER_MANAGER)).toBe(true);
      expect(promoterNavAllowed("/promotor/settings", MemberRole.PROMOTER_MANAGER)).toBe(false);
    });
  });

  describe("canCheckIn", () => {
    it("inclui caixa e porteiro", () => {
      expect(canCheckIn(MemberRole.PROMOTER_CASHIER)).toBe(true);
      expect(canCheckIn(MemberRole.PROMOTER_CHECKIN)).toBe(true);
      expect(canCheckIn(MemberRole.PROMOTER_FINANCE)).toBe(false);
    });
  });

  describe("canAccessOrgFinance", () => {
    it("gestor vê finanças", () => {
      expect(canAccessOrgFinance(MemberRole.PROMOTER_MANAGER)).toBe(true);
    });
  });
});
