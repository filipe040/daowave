/**
 * Input Validation
 * Zod schemas for common validations
 */

import { z } from 'zod';

export const emailSchema = z.string().email('Email inválido');

export const passwordSchema = z
  .string()
  .min(8, 'Password deve ter pelo menos 8 caracteres')
  .regex(/[A-Z]/, 'Password deve conter pelo menos uma maiúscula')
  .regex(/[a-z]/, 'Password deve conter pelo menos uma minúscula')
  .regex(/[0-9]/, 'Password deve conter pelo menos um número');

export const eventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200),
  description: z.string().min(1, 'Descrição é obrigatória'),
  venue: z.string().min(1, 'Local é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  coverImage: z.string().url().optional().or(z.literal('')),
});

export const ticketLotSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  priceCents: z.number().int().positive('Preço deve ser positivo'),
  quantityTotal: z.number().int().positive('Quantidade deve ser positiva'),
  saleStartAt: z.string().datetime(),
  saleEndAt: z.string().datetime(),
});

/** Step 1: create order (eventId + items only). ticketLotId must be UUID (DB type). */
export const checkoutCreateSchema = z.object({
  eventId: z.string().uuid(),
  items: z.array(
    z.object({
      ticketLotId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
});

/** Step 2: confirm order with buyer data and optional mock payment. buyerName/buyerEmail required. */
export const checkoutConfirmSchema = z.object({
  buyerName: z.string().min(1, 'Nome é obrigatório'),
  buyerEmail: emailSchema,
  buyerPhone: z.string().optional(),
  paymentMock: z.boolean().optional(),
});

export const manualSaleSchema = z.object({
  eventId: z.string().uuid(),
  ticketLotId: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
  paymentMethod: z.enum(['MBWAY', 'CASH', 'BANK', 'OTHER']),
  paidNow: z.boolean(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  customerName: z.string().max(100).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().max(32).optional(),
  idempotencyKey: z.string().max(64).optional(),
});
