"use client";

import { useEffect } from "react";
import { X, Percent } from "lucide-react";
import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
  companyName?: string;
};

export function OperationCostsModal({ open, onClose, companyName = "LivePass" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="operation-costs-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <div className="px-8 pt-14 pb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e2a4a] text-white shadow-lg">
            <Percent className="h-7 w-7" strokeWidth={2.25} />
          </div>

          <h2
            id="operation-costs-title"
            className="text-xl font-bold text-neutral-900 tracking-tight mb-4"
          >
            Custos de operação
          </h2>

          <p className="text-[15px] leading-relaxed text-neutral-500">
            Custos de operação incluem taxas de pagamento, faturação e gestão de bilhetes.
            Estes custos também nos permitem prestar suporte rápido e eficiente sempre que
            necessário. De acordo com os{" "}
            <Link
              href="/terms"
              className="text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
              onClick={onClose}
            >
              termos e condições
            </Link>{" "}
            da {companyName}, os custos de operação não são reembolsáveis.
          </p>
        </div>
      </div>
    </div>
  );
}
