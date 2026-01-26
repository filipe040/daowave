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

export const checkoutSchema = z.object({
  eventId: z.string().uuid(),
  items: z.array(
    z.object({
      ticketLotId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ),
  buyerName: z.string().min(1, 'Nome é obrigatório'),
  buyerEmail: emailSchema,
  buyerPhone: z.string().optional(),
});
