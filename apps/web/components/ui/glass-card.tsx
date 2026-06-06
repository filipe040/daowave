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
      "rounded-2xl sm:rounded-3xl border border-neutral-200 bg-white shadow-md",
      "transition-all duration-200 hover:shadow-lg hover:border-violet-200",
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
      "rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm",
      "transition-all duration-200",
      className
    )}
    {...props}
  />
));
GlassSection.displayName = "GlassSection";

export { GlassCard, GlassSection };
