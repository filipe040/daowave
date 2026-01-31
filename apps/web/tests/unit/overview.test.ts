/**
 * Unit tests for promoter overview aggregation (revenue, tickets, capacity)
 */

import type { EventRowForOverview } from "@/lib/services/promoter-overview.service";
import { aggregateEventsToOverview } from "@/lib/services/promoter-overview.service";

describe("aggregateEventsToOverview", () => {
  const startOfToday = new Date("2025-01-27T00:00:00.000Z");
  const startOfWeek = new Date("2025-01-26T00:00:00.000Z"); // Sunday

  it("returns zeros when no events", () => {
    const result = aggregateEventsToOverview([], startOfToday, startOfWeek);
    expect(result).toEqual({
      eventsTotal: 0,
      eventsActive: 0,
      ticketsSold: 0,
      capacityTotal: 0,
      revenueCents: 0,
      ordersPaid: 0,
      salesTodayCents: 0,
      salesThisWeekCents: 0,
    });
  });

  it("sums tickets and capacity from ticket lots", () => {
    const events: EventRowForOverview[] = [
      {
        id: "e1",
        status: "PUBLISHED",
        archivedAt: null,
        ticketLots: [
          { quantityTotal: 100, quantitySold: 30 },
          { quantityTotal: 50, quantitySold: 10 },
        ],
        orders: [],
      },
    ];
    const result = aggregateEventsToOverview(events, startOfToday, startOfWeek);
    expect(result.ticketsSold).toBe(40);
    expect(result.capacityTotal).toBe(150);
    expect(result.eventsTotal).toBe(1);
    expect(result.eventsActive).toBe(1);
  });

  it("counts only PUBLISHED non-archived as eventsActive", () => {
    const events: EventRowForOverview[] = [
      { id: "e1", status: "PUBLISHED", archivedAt: null, ticketLots: [], orders: [] },
      { id: "e2", status: "DRAFT", archivedAt: null, ticketLots: [], orders: [] },
      { id: "e3", status: "PUBLISHED", archivedAt: new Date(), ticketLots: [], orders: [] },
    ];
    const result = aggregateEventsToOverview(events, startOfToday, startOfWeek);
    expect(result.eventsTotal).toBe(3);
    expect(result.eventsActive).toBe(1);
  });

  it("sums revenue from PAID orders and splits by today/week", () => {
    const events: EventRowForOverview[] = [
      {
        id: "e1",
        status: "PUBLISHED",
        archivedAt: null,
        ticketLots: [],
        orders: [
          { totalCents: 5000, createdAt: new Date("2025-01-25T12:00:00.000Z") }, // before week
          { totalCents: 3000, createdAt: new Date("2025-01-27T10:00:00.000Z") },  // today
          { totalCents: 2000, createdAt: new Date("2025-01-26T15:00:00.000Z") },  // this week, not today
        ],
      },
    ];
    const result = aggregateEventsToOverview(events, startOfToday, startOfWeek);
    expect(result.revenueCents).toBe(10000);
    expect(result.ordersPaid).toBe(3);
    expect(result.salesTodayCents).toBe(3000);
    expect(result.salesThisWeekCents).toBe(5000); // 3000 + 2000
  });

  it("aggregates multiple events correctly", () => {
    const events: EventRowForOverview[] = [
      {
        id: "e1",
        status: "PUBLISHED",
        archivedAt: null,
        ticketLots: [{ quantityTotal: 50, quantitySold: 20 }],
        orders: [{ totalCents: 2000, createdAt: new Date("2025-01-27T09:00:00.000Z") }],
      },
      {
        id: "e2",
        status: "PUBLISHED",
        archivedAt: null,
        ticketLots: [{ quantityTotal: 100, quantitySold: 40 }],
        orders: [{ totalCents: 4000, createdAt: new Date("2025-01-26T14:00:00.000Z") }],
      },
    ];
    const result = aggregateEventsToOverview(events, startOfToday, startOfWeek);
    expect(result.eventsTotal).toBe(2);
    expect(result.eventsActive).toBe(2);
    expect(result.ticketsSold).toBe(60);
    expect(result.capacityTotal).toBe(150);
    expect(result.revenueCents).toBe(6000);
    expect(result.ordersPaid).toBe(2);
    expect(result.salesTodayCents).toBe(2000);
    expect(result.salesThisWeekCents).toBe(6000);
  });
});
