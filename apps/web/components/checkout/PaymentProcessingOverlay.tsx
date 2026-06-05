"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Ticket, CreditCard } from "lucide-react";

const STEPS = [
  { icon: ShieldCheck, label: "A verificar encomenda..." },
  { icon: CreditCard, label: "A processar pagamento..." },
  { icon: Ticket, label: "A emitir bilhetes..." },
];

export function PaymentProcessingOverlay({ active }: { active: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 900);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  const StepIcon = STEPS[stepIndex].icon;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
      role="alertdialog"
      aria-modal="true"
      aria-label="A processar pagamento"
    >
      <div className="mx-4 w-full max-w-md rounded-[32px] border border-white/10 bg-zinc-950/95 p-10 text-center shadow-2xl">
        <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10">
            <Loader2 className="h-9 w-9 animate-spin text-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">A processar pagamento</h2>
        <p className="text-sm text-white/50 mb-8">Por favor aguarde. Não feche esta página.</p>

        <div className="space-y-3 text-left">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                  current ? "bg-white/10 border border-white/10" : done ? "opacity-60" : "opacity-30"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${current ? "text-emerald-400" : "text-white/50"}`} />
                <span className={`text-[13px] ${current ? "text-white font-medium" : "text-white/60"}`}>
                  {step.label}
                </span>
                {done && <span className="ml-auto text-emerald-400 text-xs font-bold">✓</span>}
              </div>
            );
          })}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-[11px] text-white/30 uppercase tracking-widest">
          <ShieldCheck className="h-3.5 w-3.5" />
          Ligação encriptada SSL
        </p>
      </div>
    </div>
  );
}
