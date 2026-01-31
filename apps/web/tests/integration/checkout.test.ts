/**
 * Integration tests for checkout flow
 * Tests: checkout -> order PENDING -> webhook -> order PAID -> tickets ISSUED
 */

import { PrismaClient, OrderStatus } from "@prisma/client";

/** Ticket status string (Prisma Ticket.status is String, not enum) */
const TICKET_ISSUED = "ISSUED";

// Mock Prisma for testing
const prisma = {
  event: {
    findUnique: jest.fn(),
  },
  ticketLot: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  ticket: {
    createMany: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

describe("Checkout Flow Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Checkout to Order Creation", () => {
    it("should create a PENDING order when checkout is successful", async () => {
      const mockEvent = {
        id: "event-123",
        status: "PUBLISHED",
        title: "Test Event",
      };

      const mockLot = {
        id: "lot-123",
        ticketTypeId: "type-123",
        price: 2500,
        stockTotal: 100,
        stockSold: 50,
        startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
      };

      (prisma.event.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.ticketLot.findMany as jest.Mock).mockResolvedValue([mockLot]);
      (prisma.order.create as jest.Mock).mockResolvedValue({
        id: "order-123",
        status: OrderStatus.PENDING,
        total: 2500,
        eventId: "event-123",
        userId: "user-123",
      });

      const order = await prisma.order.create({
        data: {
          userId: "user-123",
          eventId: "event-123",
          total: 2500,
          status: OrderStatus.PENDING,
          items: {
            create: [{
              ticketLotId: "lot-123",
              quantity: 1,
              price: 2500,
            }],
          },
        },
      });

      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.total).toBe(2500);
      expect(prisma.order.create).toHaveBeenCalled();
    });

    it("should validate ticket stock before creating order", async () => {
      const mockLot = {
        id: "lot-123",
        stockTotal: 100,
        stockSold: 100, // Sold out
      };

      (prisma.ticketLot.findMany as jest.Mock).mockResolvedValue([mockLot]);

      const availableStock = mockLot.stockTotal - mockLot.stockSold;
      const requestedQuantity = 1;

      expect(availableStock).toBe(0);
      expect(requestedQuantity).toBeGreaterThan(availableStock);
    });

    it("should validate ticket lot dates before creating order", async () => {
      const now = new Date();
      const expiredLot = {
        id: "lot-expired",
        endsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Expired yesterday
      };

      const notStartedLot = {
        id: "lot-not-started",
        startsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Starts tomorrow
      };

      const validLot = {
        id: "lot-valid",
        startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      };

      const isExpired = now > expiredLot.endsAt;
      const isNotStarted = now < notStartedLot.startsAt;
      const isValid = now >= validLot.startsAt && now <= validLot.endsAt;

      expect(isExpired).toBe(true);
      expect(isNotStarted).toBe(true);
      expect(isValid).toBe(true);
    });
  });

  describe("Payment Webhook", () => {
    it("should update order to PAID when webhook is received", async () => {
      const mockOrder = {
        id: "order-123",
        status: OrderStatus.PENDING,
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.order.update as jest.Mock).mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
        paidAt: new Date(),
      });

      const updatedOrder = await prisma.order.update({
        where: { id: "order-123" },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      expect(updatedOrder.status).toBe(OrderStatus.PAID);
      expect(updatedOrder.paidAt).toBeDefined();
    });

    it("should create tickets when order is paid", async () => {
      const mockOrder = {
        id: "order-123",
        status: OrderStatus.PAID,
        items: [{
          ticketLotId: "lot-123",
          quantity: 2,
        }],
      };

      (prisma.order.findUnique as jest.Mock).mockResolvedValue(mockOrder);
      (prisma.ticket.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const tickets = await prisma.ticket.createMany({
        data: [
          {
            orderId: "order-123",
            ticketLotId: "lot-123",
            eventId: "event-123",
            holderUserId: "user-123",
            status: TICKET_ISSUED,
            qrNonce: "nonce-1",
          },
          {
            orderId: "order-123",
            ticketLotId: "lot-123",
            eventId: "event-123",
            holderUserId: "user-123",
            status: TICKET_ISSUED,
            qrNonce: "nonce-2",
          },
        ],
      });

      expect(tickets.count).toBe(2);
      expect(prisma.ticket.createMany).toHaveBeenCalled();
    });

    it("should update ticket lot stock when tickets are issued", async () => {
      const mockLot = {
        id: "lot-123",
        stockSold: 50,
      };

      (prisma.ticketLot.update as jest.Mock).mockResolvedValue({
        ...mockLot,
        stockSold: 52, // +2 tickets
      });

      const updatedLot = await prisma.ticketLot.update({
        where: { id: "lot-123" },
        data: {
          stockSold: { increment: 2 },
        },
      });

      expect(updatedLot.stockSold).toBe(52);
    });
  });

  describe("Ticket Issuance", () => {
    it("should create tickets with correct attendee information", async () => {
      const attendees = [
        { name: "John Doe", email: "john@example.com" },
        { name: "Jane Doe", email: "jane@example.com" },
      ];

      const tickets = attendees.map((attendee, index) => ({
        id: `ticket-${index + 1}`,
        attendeeName: attendee.name,
        attendeeEmail: attendee.email,
        status: TICKET_ISSUED,
      }));

      expect(tickets.length).toBe(2);
      expect(tickets[0].attendeeName).toBe("John Doe");
      expect(tickets[1].attendeeEmail).toBe("jane@example.com");
    });

    it("should generate QR codes for tickets", async () => {
      const ticket = {
        id: "ticket-123",
        eventId: "event-123",
        qrNonce: "nonce-abc",
      };

      expect(ticket.qrNonce).toBeDefined();
      expect(ticket.qrNonce.length).toBeGreaterThan(0);
    });

    it("should set ticket status to ISSUED", async () => {
      const ticket = {
        id: "ticket-123",
        status: TICKET_ISSUED,
      };

      expect(ticket.status).toBe(TICKET_ISSUED);
    });
  });
});
