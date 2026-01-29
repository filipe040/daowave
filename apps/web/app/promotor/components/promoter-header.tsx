"use client";

import { useState } from "react";
import CreateProjectModal from "./create-project-modal";
import { Plus } from "lucide-react";

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function PromoterHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-2xl">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="h-10 w-10 rounded-2xl border border-border bg-card flex items-center justify-center flex-shrink-0 shadow-[var(--elevation-1)]">
                <div className="grid grid-cols-2 gap-1">
                  <span className="h-1.5 w-1.5 rounded-sm bg-foreground/90" />
                  <span className="h-1.5 w-1.5 rounded-sm bg-foreground/90" />
                  <span className="h-1.5 w-1.5 rounded-sm bg-foreground/90" />
                  <span className="h-1.5 w-1.5 rounded-sm bg-foreground/90" />
                </div>
              </div>

              <div className="min-w-0">
                <h1 className="text-[15px] sm:text-[16px] font-semibold text-foreground tracking-wide">
                  ESTÚDIO
                </h1>
                <p className="text-[11px] sm:text-[12px] text-muted-foreground truncate">
                  Gestão de experiências
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full",
                "border border-border bg-foreground px-4 py-2",
                "text-[12px] sm:text-[13px] font-semibold text-background",
                "shadow-[0_18px_60px_rgba(0,0,0,.18)] transition-all duration-200",
                "hover:opacity-95 hover:shadow-[0_18px_60px_rgba(0,0,0,.26)]",
                "active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <span className="h-7 w-7 rounded-full bg-background/10 flex items-center justify-center">
                <Plus className="h-4 w-4 text-background" />
              </span>
              <span className="uppercase tracking-wide">Criar projeto</span>
            </button>
          </div>
        </div>
      </header>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}