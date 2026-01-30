"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl",
      "shadow-[0_18px_60px_rgba(0,0,0,.35)]",
      "transition-all duration-200 hover:bg-white/[0.07] hover:border-white/15",
      "animate-fade-in",
      className
    )}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";

const GlassSection = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn(
      "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 sm:p-8",
      "transition-all duration-200",
      className
    )}
    {...props}
  />
));
GlassSection.displayName = "GlassSection";

export { GlassCard, GlassSection };
