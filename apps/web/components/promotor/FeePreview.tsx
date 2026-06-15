"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

interface FeePreviewProps {
  priceEuros: string;
  organizationId?: string;
}

export function FeePreview({ priceEuros, organizationId }: FeePreviewProps) {
  const [preview, setPreview] = useState<{
    breakdown: Record<string, string>;
    feePaidBy: string;
  } | null>(null);

  useEffect(() => {
    const price = parseFloat(priceEuros.replace(",", "."));
    if (!price || price <= 0) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      const priceCents = Math.round(price * 100);
      const params = new URLSearchParams({ priceCents: String(priceCents) });
      if (organizationId) params.set("organizationId", organizationId);
      const res = await api.get<{
        breakdown: Record<string, string>;
        feePaidBy: string;
      }>(`/api/finance/fee-preview?${params}`);
      if (res.data) setPreview(res.data);
    }, 400);

    return () => clearTimeout(timer);
  }, [priceEuros, organizationId]);

  if (!preview) return null;

  return (
    <div className="rounded-xl border border-[#00a0e3]/20 bg-[#00a0e3]/10/50 p-4 space-y-2 text-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#00a0e3]">Preview financeiro</p>
      <div className="flex justify-between">
        <span className="text-neutral-600">Preço base</span>
        <span className="font-semibold">{preview.breakdown.precoBase}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-neutral-600">Taxa de serviço</span>
        <span className="font-semibold">{preview.breakdown.taxaServico}</span>
      </div>
      <div className="flex justify-between border-t border-[#00a0e3]/20 pt-2">
        <span className="font-semibold text-neutral-900">
          {preview.feePaidBy === "ORGANIZER" ? "Recebes" : "Total cliente"}
        </span>
        <span className="font-bold text-[#5ec8f8]">
          {preview.feePaidBy === "ORGANIZER" ? preview.breakdown.recebes : preview.breakdown.totalCliente}
        </span>
      </div>
    </div>
  );
}
