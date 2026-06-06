import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Bilhetes" },
  { id: 2, label: "Pagamento" },
  { id: 3, label: "Confirmação" },
] as const;

export function CheckoutStepper({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Progresso do checkout" className="mb-10">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const done = step.id < currentStep;
          const active = step.id === currentStep;
          return (
            <li key={step.id} className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-all ${
                    done
                      ? "bg-emerald-500 text-black"
                      : active
                        ? "bg-violet-600 text-white ring-4 ring-violet-200"
                        : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} /> : step.id}
                </span>
                <span
                  className={`hidden sm:block text-[13px] font-semibold tracking-wide ${
                    active ? "text-neutral-900" : done ? "text-neutral-700" : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 sm:w-16 ${done ? "bg-emerald-400" : "bg-neutral-200"}`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
