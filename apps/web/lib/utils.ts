/**
 * Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Ex: "7 agosto" */
export function formatShortDayMonth(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
}

/** Ex: "Sábado, 08 Ago às 22:00" */
export function formatPerformanceDateTime(date: Date | string): string {
  const d = new Date(date);
  const weekday = d.toLocaleDateString('pt-PT', { weekday: 'long' });
  const day = d.toLocaleDateString('pt-PT', { day: '2-digit' });
  const month = d.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '');
  const time = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${cap(weekday)}, ${day} ${cap(month)} às ${time}`;
}

export function daysUntil(date: Date | string): number {
  const target = new Date(date).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateTicketCode(): string {
  return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}
