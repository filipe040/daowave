"use client";

import { useState } from "react";
import { formatBuyerFeeLine } from "@/lib/checkout/buyer-fee-display";
import { OperationCostsModal } from "@/components/checkout/OperationCostsModal";

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
  const [showCostsModal, setShowCostsModal] = useState(false);

  const line = formatBuyerFeeLine(ticketCount, serviceFeeCents, feePaidBy);
  if (!line) return null;

  const plusIndex = line.lastIndexOf(" + ");
  const ticketsPart = line.slice(0, plusIndex);
  const feePart = line.slice(plusIndex + 3);

  return (
    <>
      <p className={`text-[13px] font-medium ${feeClassName} ${className}`}>
        {ticketsPart} +{" "}
        <button
          type="button"
          onClick={() => setShowCostsModal(true)}
          className={`inline underline decoration-dotted underline-offset-2 hover:opacity-80 transition-opacity ${feeClassName}`}
        >
          {feePart} C. operação
        </button>
      </p>

      <OperationCostsModal open={showCostsModal} onClose={() => setShowCostsModal(false)} />
    </>
  );
}
