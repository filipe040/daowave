/** Fuso horário da aplicação (Portugal continental). */
export const APP_TIMEZONE = "Europe/Lisbon";

function partsInLisbon(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
}

function partValue(parts: Intl.DateTimeFormatPart[], type: string): number {
  const v = parts.find((p) => p.type === type)?.value ?? "0";
  return Number(v);
}

/**
 * Converte instante UTC (Date/ISO) para valor de input datetime-local em hora de Lisboa.
 */
export function toDatetimeLocalLisbon(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const parts = partsInLisbon(d);
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Interpreta datetime-local (YYYY-MM-DDTHH:mm) como hora de Lisboa → Date UTC.
 */
export function parseDatetimeLocalLisbon(
  value: string,
  boundary: "start" | "end" = "start"
): Date {
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const seconds = boundary === "end" ? 59 : 0;
  const ms = boundary === "end" ? 999 : 0;

  // Ancora UTC com os mesmos componentes; corrige offset de Lisboa nesse instante
  const utcGuess = Date.UTC(year, month - 1, day, hours, minutes, seconds, ms);
  const displayed = partsInLisbon(new Date(utcGuess));

  const displayedAsUtc = Date.UTC(
    partValue(displayed, "year"),
    partValue(displayed, "month") - 1,
    partValue(displayed, "day"),
    partValue(displayed, "hour"),
    partValue(displayed, "minute"),
    partValue(displayed, "second")
  );

  const desiredAsUtc = Date.UTC(year, month - 1, day, hours, minutes, seconds, ms);
  return new Date(utcGuess + (desiredAsUtc - displayedAsUtc));
}
