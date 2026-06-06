/** Géneros disponíveis ao criar/editar eventos */
export const EVENT_CATEGORIES = [
  "Concertos",
  "Desporto",
  "Nightlife",
  "Teatro",
  "Festivais",
  "Conferências",
  "Workshops",
  "Outros",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export function isEventCategory(value: string): value is EventCategory {
  return (EVENT_CATEGORIES as readonly string[]).includes(value);
}

export function normalizeCategory(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}
