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
      "rounded-2xl sm:rounded-3xl border border-white/10 bg-[#14141f] shadow-lg shadow-black/20",
      "transition-all duration-200 hover:shadow-xl hover:border-[#00a0e3]/30",
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
      "rounded-2xl border border-white/10 bg-[#14141f] p-6 sm:p-8 shadow-lg shadow-black/20",
      "transition-all duration-200",
      className
    )}
    {...props}
  />
));
GlassSection.displayName = "GlassSection";

export { GlassCard, GlassSection };
