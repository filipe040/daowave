import { formatCurrency } from "@/lib/utils";

export function ticketCountLabel(count: number): string {
  if (count === 1) return "1 Bilhete";
  return `${count} Bilhetes`;
}

export function formatBuyerFeeLine(
  ticketCount: number,
  serviceFeeCents: number,
  feePaidBy: "BUYER" | "ORGANIZER" | string | null | undefined
): string | null {
  if (feePaidBy !== "BUYER" || serviceFeeCents <= 0) return null;
  return `${ticketCountLabel(ticketCount)} + ${formatCurrency(serviceFeeCents)}`;
}
