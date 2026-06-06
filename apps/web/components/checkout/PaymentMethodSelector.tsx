"use client";

import { CreditCard, Smartphone, Building2 } from "lucide-react";

export type PaymentMethod = "card" | "mbway" | "multibanco" | "paypal";

const METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "card",
    label: "Cartão",
    description: "Visa, Mastercard, Amex",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: "mbway",
    label: "MB WAY",
    description: "Pagamento instantâneo",
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    id: "multibanco",
    label: "Multibanco",
    description: "Referência ATM",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Conta PayPal",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .762-.647h6.64c2.17 0 3.732.448 4.648 1.332.79.74 1.085 1.795.877 3.137-.212 1.38-.78 2.526-1.69 3.404-.96.925-2.305 1.384-4 1.384h-1.9l-.72 4.563a.641.641 0 0 1-.633.548zm1.49-4.587h1.56c1.14 0 1.988-.26 2.524-.773.58-.554.91-1.374 1.01-2.494.08-.88-.05-1.54-.39-1.96-.33-.41-.92-.62-1.75-.62h-1.48l-.47 2.97v.877h.002z" />
      </svg>
    ),
  },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Método de pagamento">
      {METHODS.map((method) => {
        const selected = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-testid={`payment-method-${method.id}`}
            onClick={() => onChange(method.id)}
            className={`relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${
              selected
                ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200 shadow-lg"
                : "border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-neutral-100"
            }`}
          >
            <span className={`${selected ? "text-violet-700" : "text-neutral-600"}`}>{method.icon}</span>
            <div>
              <p className={`text-[14px] font-bold ${selected ? "text-violet-700" : "text-neutral-700"}`}>
                {method.label}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">{method.description}</p>
            </div>
            {selected && (
              <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}
