"use client";

import { formatBuyerFeeLine } from "@/lib/checkout/buyer-fee-display";

type Props = {
  ticketCount: number;
  serviceFeeCents: number;
  feePaidBy: "BUYER" | "ORGANIZER" | string | null | undefined;
  className?: string;
  feeClassName?: string;
};

export function BuyerFeeBreakdownLine({
  ticketCount,
  serviceFeeCents,
  feePaidBy,
  className = "",
  feeClassName = "text-zinc-400",
}: Props) {
  const line = formatBuyerFeeLine(ticketCount, serviceFeeCents, feePaidBy);
  if (!line) return null;

  const plusIndex = line.lastIndexOf(" + ");
  const ticketsPart = line.slice(0, plusIndex);
  const feePart = line.slice(plusIndex + 3);

  return (
    <p className={`text-[13px] font-medium ${feeClassName} ${className}`}>
      {ticketsPart} + {feePart}{" "}
      <abbr
        title="Custos de operação"
        className="underline decoration-dotted underline-offset-2 cursor-help"
      >
        C. operação
      </abbr>
    </p>
  );
}
