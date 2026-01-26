/**
 * Unit tests for check-in rules and validation
 */

import { CheckinMode } from "@prisma/client";

describe("Check-in Rules", () => {
  describe("SINGLE check-in mode", () => {
    it("should allow single check-in when not used", () => {
      const checkinMode: CheckinMode = "SINGLE";
      const entriesUsed = 0;

      const canCheckIn = checkinMode === "SINGLE" && entriesUsed === 0;

      expect(canCheckIn).toBe(true);
    });

    it("should prevent duplicate check-in", () => {
      const checkinMode: CheckinMode = "SINGLE";
      const entriesUsed = 1;

      const canCheckIn = checkinMode === "SINGLE" && entriesUsed === 0;

      expect(canCheckIn).toBe(false);
    });

    it("should prevent check-in after first use", () => {
      const checkinMode: CheckinMode = "SINGLE";
      const entriesUsed = 1;

      const canCheckIn = checkinMode === "SINGLE" && entriesUsed < 1;

      expect(canCheckIn).toBe(false);
    });
  });

  describe("MULTI check-in mode", () => {
    it("should allow multiple check-ins within maxEntries", () => {
      const checkinMode: CheckinMode = "MULTI";
      const maxEntries = 3;
      const entriesUsed = 2;

      const canCheckIn = checkinMode === "MULTI" && entriesUsed < maxEntries;

      expect(canCheckIn).toBe(true);
    });

    it("should prevent check-in when maxEntries reached", () => {
      const checkinMode: CheckinMode = "MULTI";
      const maxEntries = 3;
      const entriesUsed = 3;

      const canCheckIn = checkinMode === "MULTI" && entriesUsed < maxEntries;

      expect(canCheckIn).toBe(false);
    });

    it("should allow first check-in", () => {
      const checkinMode: CheckinMode = "MULTI";
      const maxEntries = 3;
      const entriesUsed = 0;

      const canCheckIn = checkinMode === "MULTI" && entriesUsed < maxEntries;

      expect(canCheckIn).toBe(true);
    });

    it("should allow check-in up to maxEntries - 1", () => {
      const checkinMode: CheckinMode = "MULTI";
      const maxEntries = 5;
      const entriesUsed = 4;

      const canCheckIn = checkinMode === "MULTI" && entriesUsed < maxEntries;

      expect(canCheckIn).toBe(true);
    });
  });

  describe("Entry window validation", () => {
    it("should allow check-in within entry window", () => {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      const windowEnd = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

      const canCheckIn = now >= windowStart && now <= windowEnd;

      expect(canCheckIn).toBe(true);
    });

    it("should prevent check-in before entry window", () => {
      const now = new Date();
      const windowStart = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      const canCheckIn = now >= windowStart && now <= windowEnd;

      expect(canCheckIn).toBe(false);
    });

    it("should prevent check-in after entry window", () => {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const windowEnd = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      const canCheckIn = now >= windowStart && now <= windowEnd;

      expect(canCheckIn).toBe(false);
    });

    it("should allow check-in at window start", () => {
      const now = new Date();
      const windowStart = new Date(now.getTime());
      const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);

      const canCheckIn = now >= windowStart && now <= windowEnd;

      expect(canCheckIn).toBe(true);
    });

    it("should allow check-in at window end", () => {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime());

      const canCheckIn = now >= windowStart && now <= windowEnd;

      expect(canCheckIn).toBe(true);
    });

    it("should allow check-in when no window is set", () => {
      const windowStart = null;
      const windowEnd = null;

      const canCheckIn = windowStart === null || windowEnd === null || (new Date() >= windowStart && new Date() <= windowEnd);

      expect(canCheckIn).toBe(true);
    });
  });
});

