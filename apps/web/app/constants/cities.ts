/**
 * Cidades principais para filtros públicos de eventos
 */
export const CITIES_PT = [
  "Aveiro",
  "Braga",
  "Coimbra",
  "Évora",
  "Faro",
  "Funchal",
  "Guimarães",
  "Leiria",
  "Lisboa",
  "Porto",
  "Setúbal",
  "Viana do Castelo",
  "Viseu",
] as const;

export function normalizeCityFilter(value: string): string {
  return value.trim();
}

/** Variantes comuns para match de cidade (MySQL case-sensitive) */
export function cityMatchValues(filterCity: string): string[] {
  const t = normalizeCityFilter(filterCity);
  if (!t) return [];
  const lower = t.toLocaleLowerCase("pt-PT");
  const titled = lower.charAt(0).toLocaleUpperCase("pt-PT") + lower.slice(1);
  return [...new Set([t, lower, titled, t.toUpperCase()])];
}
