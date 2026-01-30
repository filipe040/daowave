"use client";

import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Optional: eyebrow label above title */
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export function PageShell({ children, className, eyebrow, title, subtitle }: PageShellProps) {
  return (
    <div className={cn("min-h-screen bg-[hsl(var(--background))]", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {(eyebrow || title || subtitle) && (
          <header className="mb-8 sm:mb-10">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-sm sm:text-base text-white/65 max-w-2xl">
                {subtitle}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
