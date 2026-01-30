"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "error" | "warning";
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-xl animate-slide-up",
        variant === "success" && "border-emerald-500/30 bg-emerald-500/20 text-emerald-100",
        variant === "error" && "border-red-500/30 bg-red-500/20 text-red-100",
        variant === "warning" && "border-amber-500/30 bg-amber-500/20 text-amber-100",
        variant === "default" && "border-white/10 bg-white/10 text-white",
        className
      )}
      {...props}
    />
  )
);
Toast.displayName = "Toast";

export { Toast };
